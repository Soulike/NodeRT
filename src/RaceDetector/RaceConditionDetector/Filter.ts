import {ResourceDeclaration} from '../../LogStore/Class/ResourceDeclaration';
import {RaceConditionInfo} from './RaceConditionInfo';
import assert from 'assert';
import objectHash from 'object-hash';
import {ObjectInfo} from '../../LogStore/ObjectLogStore/Class/ObjectInfo';
import {ObjectOperation} from '../../LogStore/ObjectLogStore';
import {EnhancedSet} from '@datastructures-js/set';
import {OutgoingMessageInfo} from '../../LogStore/OutgoingMessageLogStore/Class/OutgoingMessageInfo';
import {OutgoingMessageOperation} from '../../LogStore/OutgoingMessageLogStore/Class/OutgoingMessageOperation';
import {SocketInfo} from '../../LogStore/SocketLogStore/Class/SocketInfo';
import {SocketOperation} from '../../LogStore/SocketLogStore/Class/SocketOperation';
import {StreamInfo} from '../../LogStore/StreamLogStore/Class/StreamInfo';
import {EventEmitterInfo} from '../../LogStore/EventEmitterLogStore/Class/EventEmitterInfo';
import {EventEmitterOperation} from '../../LogStore/EventEmitterLogStore/Class/EventEmitterOperation';
import {FileInfo} from '../../LogStore/FileLogStore/Class/FileInfo';
import {FileOperation} from '../../LogStore/FileLogStore';

export class Filter
{
    private static readonly reportedRaceCondition = new Map<ResourceDeclaration, Set<string>>();

    public static isTruePositive(raceConditionInfo: RaceConditionInfo): boolean
    {
        const {resourceInfo} = raceConditionInfo;
        if (resourceInfo instanceof ObjectInfo)
        {
            return Filter.isObjectRaceConditionTP(raceConditionInfo);
        }
        else if (resourceInfo instanceof OutgoingMessageInfo)
        {
            return Filter.isOutgoingMessageRaceConditionTP(raceConditionInfo);
        }
        else if (resourceInfo instanceof SocketInfo)
        {
            return Filter.isSocketRaceConditionTP(raceConditionInfo);
        }
        else if (resourceInfo instanceof StreamInfo)
        {
            return Filter.isStreamRaceConditionTP(raceConditionInfo);
        }
        else if (resourceInfo instanceof EventEmitterInfo)
        {
            return Filter.isEventEmitterRaceConditionTP(raceConditionInfo);
        }
        else if (resourceInfo instanceof FileInfo)
        {
            return Filter.isFileViolationTP(raceConditionInfo);
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
        for (const operation of asyncContext1Operations)
        {
            const {field} = operation;
            if (field === null) // maybe all fields are accessed
            {
                return true;
            }
            else
            {
                accessedFieldsInAsyncContext1.add(field);
            }
        }

        const asyncContext2Operations = asyncContextToOperations2[1]! as ObjectOperation[];
        const accessedFieldsInAsyncContext2 = new EnhancedSet();
        for (const operation of asyncContext2Operations)
        {
            const {field} = operation;
            if (field === null) // maybe all fields are accessed
            {
                return true;
            }
            else
            {
                accessedFieldsInAsyncContext2.add(field);
            }
        }

        return accessedFieldsInAsyncContext1.intersect(accessedFieldsInAsyncContext2).size !== 0;
    }

    private static isOutgoingMessageRaceConditionTP(raceConditionInfo: RaceConditionInfo): boolean
    {
        const {resourceInfo, asyncContextToOperations1} = raceConditionInfo;
        assert.ok(resourceInfo instanceof OutgoingMessageInfo);

        const asyncContext1Operations = asyncContextToOperations1[1];
        const asyncContext1LastOperation = asyncContext1Operations[asyncContext1Operations.length - 1];
        assert.ok(asyncContext1LastOperation instanceof OutgoingMessageOperation);

        const asyncContext1LastOperationKind = asyncContext1LastOperation.getOperationKind();

        return asyncContext1LastOperationKind === 'end'
            || asyncContext1LastOperationKind === 'destroy';
    }

    private static isSocketRaceConditionTP(raceConditionInfo: RaceConditionInfo): boolean
    {
        const {resourceInfo, asyncContextToOperations2, asyncContextToOperations1} = raceConditionInfo;
        assert.ok(resourceInfo instanceof SocketInfo);

        const asyncContext1Operations = asyncContextToOperations1[1];
        const asyncContext1LastOperation =
            asyncContext1Operations[asyncContext1Operations.length - 1];
        assert.ok(asyncContext1LastOperation instanceof SocketOperation);

        const asyncContext2Operations = asyncContextToOperations2[1];
        const asyncContext2LastOperation =
            asyncContext2Operations[asyncContext2Operations.length - 1];
        assert.ok(asyncContext2LastOperation instanceof SocketOperation);

        const asyncContext2LastOperationKind = asyncContext2LastOperation.getOperationKind();
        const asyncContext1LastOperationType = asyncContext2LastOperation.getType();

        const asyncContext1LastOperationKind = asyncContext1LastOperation.getOperationKind();

        return !(asyncContext2LastOperationKind === 'destroy'
            || (asyncContext1LastOperationKind === 'connection' && asyncContext1LastOperationType === 'write'));
    }

    private static isStreamRaceConditionTP(raceConditionInfo: RaceConditionInfo): boolean
    {
        const {resourceInfo, asyncContextToOperations1} = raceConditionInfo;
        assert.ok(resourceInfo instanceof StreamInfo);

        const asyncContext1Operations = asyncContextToOperations1[1];
        const asyncContext1LastOperation =
            asyncContext1Operations[asyncContext1Operations.length - 1];
        assert.ok(asyncContext1LastOperation instanceof OutgoingMessageOperation);

        const asyncContext1LastOperationKind = asyncContext1LastOperation.getOperationKind();

        return asyncContext1LastOperationKind === 'end'
            || asyncContext1LastOperationKind === 'destroy';
    }

    private static isEventEmitterRaceConditionTP(raceConditionInfo: RaceConditionInfo): boolean
    {
        const {resourceInfo, asyncContextToOperations1} = raceConditionInfo;
        assert.ok(resourceInfo instanceof EventEmitterInfo);

        const asyncContext1Operations = asyncContextToOperations1[1];
        const asyncContext1LastOperation =
            asyncContext1Operations[asyncContext1Operations.length - 1];
        assert.ok(asyncContext1LastOperation instanceof EventEmitterOperation);

        const asyncContext1LastOperationKind = asyncContext1LastOperation.getOperationKind();

        return asyncContext1LastOperationKind !== 'addListener';
    }

    private static isFileViolationTP(raceConditionInfo: RaceConditionInfo): boolean
    {
        const {resourceInfo, asyncContextToOperations1, asyncContextToOperations2} = raceConditionInfo;
        assert.ok(resourceInfo instanceof FileInfo);
        const asyncContext1Operations = asyncContextToOperations1[1];
        const asyncContext2Operations = asyncContextToOperations2[1];

        let asyncContext1WriteOnContent = false;
        for (const operation of asyncContext1Operations)
        {
            assert.ok(operation instanceof FileOperation);
            if (operation.getOperationOn() === 'content')
            {
                asyncContext1WriteOnContent = true;
                break;
            }
        }

        let asyncContext2WriteOnContent = false;
        for (const operation of asyncContext2Operations)
        {
            assert.ok(operation instanceof FileOperation);
            if (operation.getOperationOn() === 'content')
            {
                asyncContext2WriteOnContent = true;
                break;
            }
        }

        return !(
            asyncContext1WriteOnContent // async context1 writes on content
            && !asyncContext2WriteOnContent   // async context2 writes on stat
        );
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
        assert.ok(asyncCalledFunction2 !== null);

        const callbackFunction1Ref = asyncCalledFunction1 === null ? null : asyncCalledFunction1.deref;
        const callbackFunction2Ref = asyncCalledFunction2.deref;

        assert.ok(callbackFunction1Ref !== undefined);
        assert.ok(callbackFunction2Ref !== undefined);

        return [
            objectHash.MD5(callbackFunction1Ref),
            objectHash.MD5(callbackFunction2Ref),
        ].join(',');
    }
}