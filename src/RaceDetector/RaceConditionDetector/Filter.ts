import {ResourceDeclaration} from '../../LogStore/Class/ResourceDeclaration';
import {RaceConditionInfo} from './RaceConditionInfo';
import assert from 'assert';
import objectHash from 'object-hash';
import {ObjectInfo} from '../../LogStore/ObjectLogStore/Class/ObjectInfo';
import {ObjectOperation} from '../../LogStore/ObjectLogStore';
import {EnhancedSet} from '@datastructures-js/set';

export class Filter
{
    private static readonly reportedRaceCondition = new Map<ResourceDeclaration, Set<string>>();

    public static isTruePositive(raceConditionInfo: RaceConditionInfo): boolean
    {
        if (!Filter.isPromiseViolationTP(raceConditionInfo))
        {
            return false;
        }

        const {resourceInfo} = raceConditionInfo;
        if (resourceInfo instanceof ObjectInfo)
        {
            return Filter.isObjectRaceConditionTP(raceConditionInfo);
        }
        else
        {
            return true;
        }
    }

    public static isObjectRaceConditionTP(raceConditionInfo: RaceConditionInfo): boolean
    {
        const {resourceInfo, asyncContextToOperations1, asyncContextToOperations2} = raceConditionInfo;
        assert.ok(resourceInfo instanceof ObjectInfo);

        const asyncContext1Operations = asyncContextToOperations1[1]! as ObjectOperation[];
        const accessedFieldsInAsyncContext1 = new EnhancedSet();
        const writeFieldsInAsyncContext1 = new EnhancedSet();
        for (const operation of asyncContext1Operations)
        {
            const {fields} = operation;
            const type = operation.getType();
            if (type === 'write')
            {
                fields.forEach(field => writeFieldsInAsyncContext1.add(field));
            }
            fields.forEach(field => accessedFieldsInAsyncContext1.add(field));
        }

        const asyncContext2Operations = asyncContextToOperations2[1]! as ObjectOperation[];
        const accessedFieldsInAsyncContext2 = new EnhancedSet();
        const writeFieldsInAsyncContext2 = new EnhancedSet();
        for (const operation of asyncContext2Operations)
        {
            const {fields} = operation;
            const type = operation.getType();
            if (type === 'write')
            {
                fields.forEach(field => writeFieldsInAsyncContext2.add(field));
            }
            fields.forEach(field => accessedFieldsInAsyncContext2.add(field));
        }

        // must be written and read on the same fields
        return accessedFieldsInAsyncContext1.intersect(writeFieldsInAsyncContext2).size !== 0
            || accessedFieldsInAsyncContext2.intersect(writeFieldsInAsyncContext1).size !== 0;
    }

    /**
     * In some apis (e.g. fs), we log operations on resolve of promises (using .finally())
     * which do not race with user code. So filter them out.
     * */
    private static isPromiseViolationTP(raceConditionInfo: RaceConditionInfo): boolean
    {
        const {
            asyncContextToOperations1: [asyncContext1],
            asyncContextToOperations2: [asyncContext2],
        } = raceConditionInfo;
        if (asyncContext1.asyncType === 'PROMISE' && asyncContext2.asyncType === 'PROMISE')
        {
            return !(asyncContext1.codeInfo === null    // violator is located in analysis code
                && asyncContext2.codeInfo !== null    // operation2 is located in user code
            );
        }
        else
        {
            return true;
        }
    }

    /**
     * Check if the RaceConditionInfo has been reported
     */
    public static hasReported(resourceDeclaration: ResourceDeclaration, raceConditionInfo: RaceConditionInfo): boolean
    {
        const hashes = Filter.reportedRaceCondition.get(resourceDeclaration);
        if (hashes === undefined)
        {
            return false;
        }
        const hash = Filter.getRaceConditionInfoHash(raceConditionInfo);
        if (hash === null)
        {
            return false;
        }
        else
        {
            return hashes.has(hash);
        }
    }

    public static addReported(resourceDeclaration: ResourceDeclaration, raceConditionInfo: RaceConditionInfo): void
    {
        let hashes = Filter.reportedRaceCondition.get(resourceDeclaration) ?? new Set();
        const hash = Filter.getRaceConditionInfoHash(raceConditionInfo);
        if (hash !== null)
        {
            hashes.add(hash);
        }
        Filter.reportedRaceCondition.set(resourceDeclaration, hashes);
    }

    /**
     * Calculate an unique hash for a ViolationInfo
     * if any of the callbacks is invoked by C++ modules, which is not able to be hashed, returns null
     */
    private static getRaceConditionInfoHash(raceConditionInfo: RaceConditionInfo): string | null
    {
        const {
            asyncContextToOperations1, asyncContextToOperations2,
        } = raceConditionInfo;

        const [asyncCalledFunction1, asyncCalledFunction2] = [
            asyncContextToOperations1[0].functionWeakRef,
            asyncContextToOperations2[0].functionWeakRef,
        ];

        const callbackFunction1Ref = asyncCalledFunction1 === null ? null : asyncCalledFunction1.deref;
        const callbackFunction2Ref = asyncCalledFunction2 === null ? null : asyncCalledFunction2.deref;

        assert.ok(callbackFunction1Ref !== undefined);
        assert.ok(callbackFunction2Ref !== undefined);

        if (callbackFunction2Ref !== null)
        {
            return [
                objectHash.MD5(callbackFunction1Ref),
                objectHash.MD5(callbackFunction2Ref),
            ].join(',');
        }
        else
        {
            const [asyncContext1AsyncId, asyncContext2AsyncId] = [
                asyncContextToOperations1[0].asyncId,
                asyncContextToOperations2[0].asyncId,
            ];
            return [
                objectHash.MD5(asyncContext1AsyncId),
                objectHash.MD5(asyncContext2AsyncId),
            ].join(',');
        }
    }
}