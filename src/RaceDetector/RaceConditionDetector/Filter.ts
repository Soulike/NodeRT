import {ResourceDeclaration} from '../../LogStore/Class/ResourceDeclaration';
import {RaceConditionInfo} from './RaceConditionInfo';
import assert from 'assert';
import {ObjectInfo} from '../../LogStore/ObjectLogStore/Class/ObjectInfo';
import {ObjectOperation} from '../../LogStore/ObjectLogStore';
import {EnhancedSet} from '@datastructures-js/set';
import {PrimitiveOperation} from '../../LogStore/PrimitiveLogStore';
import {PrimitiveInfo} from '../../LogStore/PrimitiveLogStore/Class/PrimitiveInfo';
import {EventEmitterInfo} from '../../LogStore/EventEmitterLogStore/Class/EventEmitterInfo';
import {EventEmitterOperation} from '../../LogStore/EventEmitterLogStore/Class/EventEmitterOperation';
import {BufferInfo} from '../../LogStore/BufferLogStore/Class/BufferInfo';
import {BufferOperation} from '../../LogStore/BufferLogStore';

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
        else if (resourceInfo instanceof PrimitiveInfo)
        {
            return Filter.isPrimitiveRaceConditionTP(raceConditionInfo);
        }
        else if (resourceInfo instanceof EventEmitterInfo)
        {
            return Filter.isEventEmitterRaceConditionTP(raceConditionInfo);
        }
        else if (resourceInfo instanceof BufferInfo)
        {
            return Filter.isBufferRaceConditionTP(raceConditionInfo);
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
        return ((accessedFieldsInAsyncContext1.intersect(writeFieldsInAsyncContext2)).size !== 0)
            || ((accessedFieldsInAsyncContext2.intersect(writeFieldsInAsyncContext1)).size !== 0);
    }

    public static isBufferRaceConditionTP(raceConditionInfo: RaceConditionInfo): boolean
    {
        const {resourceInfo, asyncContextToOperations1, asyncContextToOperations2} = raceConditionInfo;
        assert.ok(resourceInfo instanceof BufferInfo);
        const asyncContext1Operations = asyncContextToOperations1[1]! as BufferOperation[];
        const accessedRangesInAsyncContext1: BufferOperation['accessRange'][] = [];
        const writeRangesInAsyncContext1: BufferOperation['accessRange'][] = [];
        for (const operation of asyncContext1Operations)
        {
            const accessRange = operation.getAccessRange();
            const type = operation.getType();
            if (type === 'write')
            {
                writeRangesInAsyncContext1.push(accessRange);
            }
            accessedRangesInAsyncContext1.push(accessRange);
        }

        const asyncContext2Operations = asyncContextToOperations2[1]! as BufferOperation[];
        const accessedRangesInAsyncContext2: BufferOperation['accessRange'][] = [];
        const writeRangesInAsyncContext2: BufferOperation['accessRange'][] = [];
        for (const operation of asyncContext2Operations)
        {
            const accessRange = operation.getAccessRange();
            const type = operation.getType();
            if (type === 'write')
            {
                writeRangesInAsyncContext2.push(accessRange);
            }
            accessedRangesInAsyncContext2.push(accessRange);
        }

        for (const {start: start1, end: end1} of accessedRangesInAsyncContext1)
        {
            for (const {start: start2, end: end2} of writeRangesInAsyncContext2)
            {
                if (!(end1 <= start2 || end2 <= start1)) // overlap
                {
                    return true;
                }
            }
        }

        for (const {start: start1, end: end1} of accessedRangesInAsyncContext2)
        {
            for (const {start: start2, end: end2} of writeRangesInAsyncContext1)
            {
                if (!(end1 <= start2 || end2 <= start1)) // overlap
                {
                    return true;
                }
            }
        }

        return false;
    }

    public static isPrimitiveRaceConditionTP(raceConditionInfo: RaceConditionInfo): boolean
    {
        assert.ok(raceConditionInfo.resourceInfo instanceof PrimitiveInfo);
        const {asyncContextToOperations1, asyncContextToOperations2, resourceInfo} = raceConditionInfo;
        const asyncContext1 = asyncContextToOperations1[0];
        const asyncContext2 = asyncContextToOperations2[0];
        const asyncContext1Operations = asyncContextToOperations1[1] as readonly PrimitiveOperation[];
        const asyncContext2Operations = asyncContextToOperations2[1] as readonly PrimitiveOperation[];
        if (asyncContext1.getHasWriteOperationOn(resourceInfo) && asyncContext2.getHasWriteOperationOn(resourceInfo))
        {
            let asyncContext1LastWriteOperation: PrimitiveOperation | null = null;
            let asyncContext2LastWriteOperation: PrimitiveOperation | null = null;
            for (let i = asyncContext1Operations.length - 1; i >= 0; i--)
            {
                if (asyncContext1Operations[i]!.getType() === 'write')
                {
                    asyncContext1LastWriteOperation = asyncContext1Operations[i]!;
                    break;
                }
            }
            assert.ok(asyncContext1LastWriteOperation !== null);
            for (let i = asyncContext2Operations.length - 1; i >= 0; i--)
            {
                if (asyncContext2Operations[i]!.getType() === 'write')
                {
                    asyncContext2LastWriteOperation = asyncContext2Operations[i]!;
                    break;
                }
            }
            assert.ok(asyncContext2LastWriteOperation !== null);
            // If they write the same value, no matter who writes first
            return asyncContext1LastWriteOperation.value !== asyncContext2LastWriteOperation.value;
        }
        else
        {
            return true;
        }
    }

    public static isEventEmitterRaceConditionTP(raceConditionInfo: RaceConditionInfo): boolean
    {
        assert.ok(raceConditionInfo.resourceInfo instanceof EventEmitterInfo);
        const {asyncContextToOperations1, asyncContextToOperations2, resourceInfo} = raceConditionInfo;
        const asyncContext1 = asyncContextToOperations1[0];
        const asyncContext2 = asyncContextToOperations2[0];
        const asyncContext1Operations = asyncContextToOperations1[1] as readonly EventEmitterOperation[];
        const asyncContext2Operations = asyncContextToOperations2[1] as readonly EventEmitterOperation[];
        if (asyncContext1.getHasWriteOperationOn(resourceInfo) && asyncContext2.getHasWriteOperationOn(resourceInfo))
        {
            let asyncContext1LastWriteOperation: EventEmitterOperation | null = null;
            let asyncContext2LastWriteOperation: EventEmitterOperation | null = null;
            for (let i = asyncContext1Operations.length - 1; i >= 0; i--)
            {
                if (asyncContext1Operations[i]!.getType() === 'write')
                {
                    asyncContext1LastWriteOperation = asyncContext1Operations[i]!;
                    break;
                }
            }
            assert.ok(asyncContext1LastWriteOperation !== null);
            for (let i = asyncContext2Operations.length - 1; i >= 0; i--)
            {
                if (asyncContext2Operations[i]!.getType() === 'write')
                {
                    asyncContext2LastWriteOperation = asyncContext2Operations[i]!;
                    break;
                }
            }
            assert.ok(asyncContext2LastWriteOperation !== null);
            // If they affect the same listener, no matter who affects first
            return !(asyncContext1LastWriteOperation.getAffectedListeners()
                .equals(asyncContext2LastWriteOperation.getAffectedListeners()));
        }
        else
        {
            return true;
        }
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

    private static getRaceConditionInfoHash(raceConditionInfo: RaceConditionInfo): string | null
    {
        const {
            asyncContextToOperations1, asyncContextToOperations2,
        } = raceConditionInfo;

        return [
            asyncContextToOperations1[0].index,
            asyncContextToOperations2[0].index,
        ].join(',');
    }
}