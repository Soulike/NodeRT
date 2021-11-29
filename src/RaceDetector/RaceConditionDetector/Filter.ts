import {RaceConditionInfo} from './RaceConditionInfo';
import assert from 'assert';
import {ObjectInfo} from '../../LogStore/ObjectLogStore/Class/ObjectInfo';
import {ObjectOperation} from '../../LogStore/ObjectLogStore';
import {EnhancedSet} from '@datastructures-js/set';
import {PrimitiveLogStore, PrimitiveOperation} from '../../LogStore/PrimitiveLogStore';
import {PrimitiveInfo} from '../../LogStore/PrimitiveLogStore/Class/PrimitiveInfo';
import {BufferInfo} from '../../LogStore/BufferLogStore/Class/BufferInfo';
import {BufferOperation} from '../../LogStore/BufferLogStore';
import {SocketInfo} from '../../LogStore/SocketLogStore/Class/SocketInfo';
import {SocketOperation} from '../../LogStore/SocketLogStore/Class/SocketOperation';
import {AsyncCalledFunctionInfo} from '../../LogStore/Class/AsyncCalledFunctionInfo';
import {FileInfo} from '../../LogStore/FileLogStore/Class/FileInfo';
import {FileOperation} from '../../LogStore/FileLogStore';
import {ResourceInfo} from '../../LogStore/Class/ResourceInfo';
import {EventEmitterInfo} from '../../LogStore/EventEmitterLogStore/Class/EventEmitterInfo';
import {EventEmitterOperation} from '../../LogStore/EventEmitterLogStore/Class/EventEmitterOperation';
import {isRunningUnitTests} from '../../Util';

export class Filter
{
    private static readonly reportedRaceCondition = new Map<string | object, Set<string>>();

    public static isTruePositive(raceConditionInfo: RaceConditionInfo): boolean
    {
        const {resourceInfo} = raceConditionInfo;
        if (resourceInfo.getPossibleDefineCodeScope() === null)
        {
            return false;
        }
        if (Filter.isNonAnalyzedCodeRaceCondition(raceConditionInfo))
        {
            return false;
        }
        if (!Filter.isPromiseViolationTP(raceConditionInfo))
        {
            return false;
        }
        if (!Filter.isTimerRaceConditionTP(raceConditionInfo))
        {
            return false;
        }
        if (!Filter.isImmediateRaceConditionTP(raceConditionInfo))
        {
            return false;
        }
        if (Filter.isInnerFunction(raceConditionInfo))
        {
            return false;
        }
        if (Filter.isHttpIncomingMessagesOfTheSameServer(raceConditionInfo))
        {
            return false;
        }


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
        else if (resourceInfo instanceof SocketInfo)
        {
            return Filter.isSocketRaceConditionTP(raceConditionInfo);
        }
        else if (resourceInfo instanceof FileInfo)
        {
            return Filter.isFileRaceConditionTP(raceConditionInfo);
        }
        else
        {
            return true;
        }
    }

    /**
     * 2 "HTTPINCOMINGMESSAGE"s, if they are invoked by the same server, won't form race condition
     */
    public static isHttpIncomingMessagesOfTheSameServer(raceConditionInfo: RaceConditionInfo): boolean
    {
        const {asyncContextToOperations1, asyncContextToOperations2} = raceConditionInfo;
        let asyncContext1: AsyncCalledFunctionInfo | null = asyncContextToOperations1[0];
        let asyncContext2: AsyncCalledFunctionInfo | null = asyncContextToOperations2[0];

        while (asyncContext1.asyncType === 'TickObject')
        {
            asyncContext1 = asyncContext1.asyncContext!;
        }
        while (asyncContext2.asyncType === 'TickObject')
        {
            asyncContext2 = asyncContext2.asyncContext!;
        }

        if (asyncContext1.asyncType !== 'HTTPINCOMINGMESSAGE' || asyncContext2.asyncType !== 'HTTPINCOMINGMESSAGE')
        {
            return false;
        }
        else
        {
            while (asyncContext1.asyncType !== 'TCPSERVERWRAP')
            {
                asyncContext1 = asyncContext1.asyncContext;
                if (asyncContext1 === null)
                {
                    return false;
                }
            }
            while (asyncContext2.asyncType !== 'TCPSERVERWRAP')
            {
                asyncContext2 = asyncContext2.asyncContext;
                if (asyncContext2 === null)
                {
                    return false;
                }
            }
            return asyncContext1.asyncId === asyncContext2.asyncId;
        }
    }

    /**
     * If the function of asyncContext2 is defined inside the function of asyncContext1,
     * no matter how the function of asyncContext2 is asynchronously called,
     * there must be asyncContext1 -> asyncContext2
     */
    public static isInnerFunction(raceConditionInfo: RaceConditionInfo): boolean
    {
        const {asyncContextToOperations1, asyncContextToOperations2} = raceConditionInfo;
        const asyncContext1 = asyncContextToOperations1[0];
        const asyncContext2 = asyncContextToOperations2[0];
        const asyncContext1Function = asyncContext1.functionWeakRef?.deref();
        const asyncContext2Function = asyncContext2.functionWeakRef?.deref();
        if (asyncContext1Function === undefined || asyncContext2Function === undefined)
        {
            return false;
        }
        const asyncContext1FunctionDeclaration =
            PrimitiveLogStore.findFunctionDeclarationFromPrimitiveDeclarations(asyncContext1Function);
        const asyncContext2FunctionDeclaration =
            PrimitiveLogStore.findFunctionDeclarationFromPrimitiveDeclarations(asyncContext2Function);
        if (asyncContext1FunctionDeclaration === null || asyncContext2FunctionDeclaration === null)
        {
            return false;
        }
        const asyncContext2FunctionDeclarationScope = asyncContext2FunctionDeclaration.getScope();
        if (asyncContext2FunctionDeclarationScope === null)
        {
            return false;
        }
        let currentAsyncContext2FunctionDeclarationParentScope = asyncContext2FunctionDeclarationScope.parent;
        while (currentAsyncContext2FunctionDeclarationParentScope !== null)
        {
            if (currentAsyncContext2FunctionDeclarationParentScope.func?.deref() === asyncContext1Function)
            {
                return false;
            }
            currentAsyncContext2FunctionDeclarationParentScope = currentAsyncContext2FunctionDeclarationParentScope.parent;
        }
        return false;
    }

    /**
     * If both async context is not from analyzed code, e.g. node_modules or internal, it should be a false positive
     */
    public static isNonAnalyzedCodeRaceCondition(raceConditionInfo: RaceConditionInfo): boolean
    {
        const {asyncContextToOperations1, asyncContextToOperations2} = raceConditionInfo;
        let asyncContext1 = asyncContextToOperations1[0];
        let asyncContext2 = asyncContextToOperations2[0];

        while (asyncContext1.asyncType === 'TickObject')
        {
            asyncContext1 = asyncContext1.asyncContext!;
        }
        while (asyncContext2.asyncType === 'TickObject')
        {
            asyncContext2 = asyncContext2.asyncContext!;
        }

        return asyncContext1.codeInfo === null && asyncContext2.codeInfo === null;
    }

    public static isTimerRaceConditionTP(raceConditionInfo: RaceConditionInfo): boolean
    {
        const {asyncContextToOperations1, asyncContextToOperations2} = raceConditionInfo;
        let asyncContext1 = asyncContextToOperations1[0];
        let asyncContext2 = asyncContextToOperations2[0];

        while (asyncContext1.asyncType === 'TickObject')
        {
            asyncContext1 = asyncContext1.asyncContext!;
        }
        while (asyncContext2.asyncType === 'TickObject')
        {
            asyncContext2 = asyncContext2.asyncContext!;
        }

        if (asyncContext1.asyncContext !== asyncContext2.asyncContext)
        {
            return true;
        }
        else if (asyncContext1.asyncType === 'Timeout' && asyncContext2.asyncType === 'Timeout')
        {
            const asyncContext1TimerInfo = asyncContext1.timerInfo;
            const asyncContext2TimerInfo = asyncContext2.timerInfo;

            if (asyncContext1TimerInfo === null || asyncContext2TimerInfo === null)
            {
                return true;
            }

            // If asyncContext1 is registered earlier and the delay of asyncContext1 is smaller,
            // it must happen before asyncContext2 and there is not race condition.
            return !(asyncContext1TimerInfo.index <= asyncContext2TimerInfo.index
                && asyncContext1TimerInfo.delay <= asyncContext2TimerInfo.delay);
        }
        else
        {
            return true;
        }
    }

    public static isImmediateRaceConditionTP(raceConditionInfo: RaceConditionInfo): boolean
    {
        const {asyncContextToOperations1, asyncContextToOperations2} = raceConditionInfo;
        let asyncContext1 = asyncContextToOperations1[0];
        let asyncContext2 = asyncContextToOperations2[0];

        if (isRunningUnitTests())
        {
            // Test frameworks like mocha use setImmediate to initialize resources before running each test case.
            // These initializations won't form race condition.
            if (asyncContext1.asyncType === 'Immediate' && asyncContext1.codeInfo === null
                || asyncContext2.asyncType === 'Immediate' && asyncContext2.codeInfo === null)
            {
                return false;
            }

            // Test frameworks like mocha use setImmediate run test cases
            // Test cases won't form race condition.
            if (asyncContext1.asyncType === 'Immediate' && asyncContext1.immediateInfo === null
                || asyncContext2.asyncType === 'Immediate' && asyncContext2.immediateInfo === null)
            {
                return false;
            }
        }

        while (asyncContext1.asyncType === 'TickObject')
        {
            asyncContext1 = asyncContext1.asyncContext!;
        }
        while (asyncContext2.asyncType === 'TickObject')
        {
            asyncContext2 = asyncContext2.asyncContext!;
        }
        if (asyncContext1.asyncContext !== asyncContext2.asyncContext)
        {
            return true;
        }
        else if (asyncContext1.asyncType === 'Immediate' && asyncContext2.asyncType === 'Immediate')
        {
            const asyncContext1ImmediateInfo = asyncContext1.immediateInfo;
            const asyncContext2ImmediateInfo = asyncContext2.immediateInfo;

            if (asyncContext1ImmediateInfo === null || asyncContext2ImmediateInfo === null)
            {
                return true;
            }

            // If asyncContext1 is registered earlier,
            // it must happen before asyncContext2 and there is not race condition.
            return !(asyncContext1ImmediateInfo.index <= asyncContext2ImmediateInfo.index);
        }
        else
        {
            return true;
        }
    }

    public static isFileRaceConditionTP(raceConditionInfo: RaceConditionInfo): boolean
    {
        const {resourceInfo, asyncContextToOperations1, asyncContextToOperations2} = raceConditionInfo;
        assert.ok(resourceInfo instanceof FileInfo);
        const asyncContext1Operations = asyncContextToOperations1[1]! as readonly FileOperation[];
        const asyncContext2Operations = asyncContextToOperations2[1]! as readonly FileOperation[];

        let asyncContext1ReadStat = false;
        let asyncContext1WriteStat = false;
        let asyncContext2ReadStat = false;
        let asyncContext2WriteStat = false;

        let asyncContext1ReadContent = false;
        let asyncContext1WriteContent = false;
        let asyncContext2ReadContent = false;
        let asyncContext2WriteContent = false;

        for (const operation of asyncContext1Operations)
        {
            const operationOn = operation.getOperationOn();
            if (operationOn === 'stat')
            {
                if (operation.getType() === 'read')
                {
                    asyncContext1ReadStat = true;
                }
                else
                {
                    asyncContext1WriteStat = true;
                }
            }
            else if (operationOn === 'content')
            {
                if (operation.getType() === 'read')
                {
                    asyncContext1ReadContent = true;
                }
                else
                {
                    asyncContext1WriteContent = true;
                }
            }
        }

        for (const operation of asyncContext2Operations)
        {
            const operationOn = operation.getOperationOn();
            if (operationOn === 'stat')
            {
                if (operation.getType() === 'read')
                {
                    asyncContext2ReadStat = true;
                }
                else
                {
                    asyncContext2WriteStat = true;
                }
            }
            else if (operationOn === 'content')
            {
                if (operation.getType() === 'read')
                {
                    asyncContext2ReadContent = true;
                }
                else
                {
                    asyncContext2WriteContent = true;
                }
            }
        }

        return (asyncContext1ReadStat && asyncContext2WriteStat)
            || (asyncContext1WriteStat && asyncContext2ReadStat)

            || (asyncContext1WriteStat && asyncContext2WriteStat)

            || (asyncContext1ReadContent && asyncContext2WriteContent)
            || (asyncContext1WriteContent && asyncContext2ReadContent)

            || (asyncContext1WriteContent && asyncContext2WriteContent)

            || ((asyncContext1ReadContent || asyncContext1WriteContent) && asyncContext2WriteStat)
            || (asyncContext1WriteStat && (asyncContext2ReadContent || asyncContext2WriteContent));
    }

    public static isSocketRaceConditionTP(raceConditionInfo: RaceConditionInfo): boolean
    {
        const {resourceInfo, asyncContextToOperations1, asyncContextToOperations2} = raceConditionInfo;
        assert.ok(resourceInfo instanceof SocketInfo);

        const asyncContext1Operations = asyncContextToOperations1[1]! as readonly SocketOperation[];
        for (const operation of asyncContext1Operations)
        {
            // no operation can be done before construction. no race here
            if (operation.getOperationKind() === 'construction')
            {
                return false;
            }
        }

        const asyncContext2Operations = asyncContextToOperations2[1]! as readonly SocketOperation[];

        if (asyncContext2Operations.length === 1)
        {
            const asyncContext2Operation = asyncContext2Operations[0]!;
            // internal operation
            return !(
                (asyncContext2Operation.getOperationKind() === 'destroy'
                    || asyncContext2Operation.getOperationKind() === 'end')
                && asyncContext2Operation.getScopeCodeInfo() === null);
        }
        else if (asyncContext2Operations.length === 2)
        {
            const asyncContext2Operation1 = asyncContext2Operations[0]!;
            const asyncContext2Operation2 = asyncContext2Operations[1]!;
            // internal operation
            return !(
                (asyncContext2Operation1.getOperationKind() === 'end' && asyncContext2Operation1.getScopeCodeInfo() === null)
                && asyncContext2Operation2.getOperationKind() === 'destroy' && asyncContext2Operation2.getScopeCodeInfo() === null
            );
        }
        else
        {
            return true;
        }
    }

    private static objectAccessedFieldsCache: Map<AsyncCalledFunctionInfo, Map<ObjectInfo, EnhancedSet<unknown>>> = new Map();
    private static objectWrittenFieldsCache: Map<AsyncCalledFunctionInfo, Map<ObjectInfo, EnhancedSet<unknown>>> = new Map();
    public static isObjectRaceConditionTP(raceConditionInfo: RaceConditionInfo): boolean
    {
        const {resourceInfo, asyncContextToOperations1, asyncContextToOperations2} = raceConditionInfo;
        assert.ok(resourceInfo instanceof ObjectInfo);
        const asyncContext2 = asyncContextToOperations2[0]!;

        // It's impossible that any operation to a object is invoked before its constructor
        const asyncContext1 = asyncContextToOperations1[0]!;
        const object = resourceInfo.getObject();
        assert.ok(object !== undefined);
        if (asyncContext1.functionWeakRef?.deref() === Object.getPrototypeOf(object).constructor)
        {
            return false;
        }

        const asyncContext1Operations = asyncContextToOperations1[1]! as ObjectOperation[];

        if (asyncContext1.getHasWriteOperationOn(resourceInfo))
        {
            for (const operation of asyncContext1Operations)
            {
                // It's impossible that a object construction forms race condition
                if (operation.isConstruction)
                {
                    return false;
                }
            }
        }

        // AsyncContext1 has ended, we can get fields info from cache
        let accessedFieldsInAsyncContext1 = Filter.objectAccessedFieldsCache.get(asyncContext1)?.get(resourceInfo);
        let writeFieldsInAsyncContext1 = Filter.objectWrittenFieldsCache.get(asyncContext1)?.get(resourceInfo);

        if (accessedFieldsInAsyncContext1 === undefined || writeFieldsInAsyncContext1 === undefined)    // cache miss
        {
            accessedFieldsInAsyncContext1 = new EnhancedSet();
            writeFieldsInAsyncContext1 = new EnhancedSet();
            for (const operation of asyncContext1Operations)
            {
                const {fields} = operation;
                const type = operation.getType();
                if (type === 'write')
                {
                    fields.forEach(field => writeFieldsInAsyncContext1!.add(field));
                }
                fields.forEach(field => accessedFieldsInAsyncContext1!.add(field));
            }

            Filter.objectAccessedFieldsCache.set(asyncContext1,
                (Filter.objectAccessedFieldsCache.get(asyncContext1) ?? new Map()).set(resourceInfo, accessedFieldsInAsyncContext1));
            Filter.objectWrittenFieldsCache.set(asyncContext1,
                (Filter.objectWrittenFieldsCache.get(asyncContext1) ?? new Map()).set(resourceInfo, writeFieldsInAsyncContext1));
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
        Filter.objectAccessedFieldsCache.set(asyncContext2,
            (Filter.objectAccessedFieldsCache.get(asyncContext2) ?? new Map()).set(resourceInfo, accessedFieldsInAsyncContext2));
        Filter.objectWrittenFieldsCache.set(asyncContext2,
            (Filter.objectWrittenFieldsCache.get(asyncContext2) ?? new Map()).set(resourceInfo, writeFieldsInAsyncContext2));

        // must be written and read on the same fields
        return ((accessedFieldsInAsyncContext1.intersect(writeFieldsInAsyncContext2)).size !== 0)
            || ((accessedFieldsInAsyncContext2.intersect(writeFieldsInAsyncContext1)).size !== 0);
    }

    private static bufferAccessedRangesCache: Map<AsyncCalledFunctionInfo, Map<BufferInfo, BufferOperation['accessRange'][]>> = new Map();
    private static bufferWrittenRangesCache: Map<AsyncCalledFunctionInfo, Map<BufferInfo, BufferOperation['accessRange'][]>> = new Map();
    public static isBufferRaceConditionTP(raceConditionInfo: RaceConditionInfo): boolean
    {
        const {resourceInfo, asyncContextToOperations1, asyncContextToOperations2} = raceConditionInfo;
        const asyncContext1 = asyncContextToOperations1[0];
        const asyncContext2 = asyncContextToOperations2[0];
        assert.ok(resourceInfo instanceof BufferInfo);
        const asyncContext1Operations = asyncContextToOperations1[1]! as BufferOperation[];
        let accessedRangesInAsyncContext1: BufferOperation['accessRange'][] | undefined = Filter.bufferAccessedRangesCache.get(asyncContext1)?.get(resourceInfo);
        let writeRangesInAsyncContext1: BufferOperation['accessRange'][] | undefined = Filter.bufferWrittenRangesCache.get(asyncContext1)?.get(resourceInfo);
        if (accessedRangesInAsyncContext1 === undefined || writeRangesInAsyncContext1 === undefined)
        {
            accessedRangesInAsyncContext1 = [];
            writeRangesInAsyncContext1 = [];
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

            Filter.bufferAccessedRangesCache.set(asyncContext1,
                (Filter.bufferAccessedRangesCache.get(asyncContext1) ?? new Map()).set(resourceInfo, accessedRangesInAsyncContext1));
            Filter.bufferWrittenRangesCache.set(asyncContext1,
                (Filter.bufferWrittenRangesCache.get(asyncContext1) ?? new Map()).set(resourceInfo, writeRangesInAsyncContext1));
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

        Filter.bufferAccessedRangesCache.set(asyncContext2,
            (Filter.bufferAccessedRangesCache.get(asyncContext2) ?? new Map()).set(resourceInfo, accessedRangesInAsyncContext2));
        Filter.bufferWrittenRangesCache.set(asyncContext2,
            (Filter.bufferWrittenRangesCache.get(asyncContext2) ?? new Map()).set(resourceInfo, writeRangesInAsyncContext2));

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

        if (asyncContext1.getHasWriteOperationOn(resourceInfo))
        {
            for (const operation of asyncContext1Operations)
            {
                // It's impossible that a variable initialization forms race condition
                if (operation.isInitialization)
                {
                    return false;
                }
            }
        }

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

            if ((asyncContext1LastWriteOperation.getOperationKind() === 'addListener'
                && asyncContext2LastWriteOperation.getOperationKind() === 'addListener')
                || (asyncContext1LastWriteOperation.getOperationKind() === 'removeListener'
                    && asyncContext2LastWriteOperation.getOperationKind() === 'removeListener'))
            {
                return false;
            }
            else
            {
                return true;
            }
        }
        else
        {
            return true;
        }
    }

    /**
     * Check if the RaceConditionInfo has been reported
     */
    public static hasReported(raceConditionInfo: RaceConditionInfo): boolean
    {
        const hashes = Filter.reportedRaceCondition.get(Filter.getResourceInfoHash(raceConditionInfo.resourceInfo));
        if (hashes === undefined)
        {
            return false;
        }
        const hashPair = Filter.getRaceConditionInfoHashPair(raceConditionInfo);
        if (hashPair === null)
        {
            return false;
        }
        else
        {
            return hashes.has(hashPair[0]) || hashes.has(hashPair[1]);
        }
    }

    public static addReported(raceConditionInfo: RaceConditionInfo): void
    {
        const resourceInfoHash = Filter.getResourceInfoHash(raceConditionInfo.resourceInfo);
        let hashes = Filter.reportedRaceCondition.get(resourceInfoHash) ?? new Set();
        const hashPair = Filter.getRaceConditionInfoHashPair(raceConditionInfo);
        if (hashPair !== null)
        {
            hashes.add(hashPair[0]);
            hashes.add(hashPair[1]);
        }
        Filter.reportedRaceCondition.set(resourceInfoHash, hashes);
    }

    private static isPromiseViolationTP(raceConditionInfo: RaceConditionInfo): boolean
    {
        const {
            asyncContextToOperations1: [asyncContext1],
            asyncContextToOperations2: [asyncContext2],
        } = raceConditionInfo;
        /**
         * In some apis (e.g. fs), we log operations on resolve of promises (using .finally())
         * which do not race with user code. So filter them out.
         * */
        if (asyncContext1.asyncType === 'PROMISE' && asyncContext2.asyncType === 'PROMISE')
        {
            if (asyncContext1.codeInfo === null    // violator is located in analysis code
                && asyncContext2.codeInfo !== null    // operation2 is located in user code
            )
            {
                return false;
            }
        }

        /**
         * Filter out promise priority related false positives
         */
        if (asyncContext1.asyncType === 'PROMISE' && asyncContext2.asyncType === 'PROMISE')
        {
            return true;
        }
        else if (asyncContext1.asyncType !== 'PROMISE' && asyncContext2.asyncType === 'PROMISE')
        {
            return true;
        }
        else if (asyncContext1.asyncType === 'PROMISE' && asyncContext2.asyncType !== 'PROMISE')
        {
            return false;
        }
        else
        {
            return true;
        }
    }

    private static getRaceConditionInfoHashPair(raceConditionInfo: RaceConditionInfo): [string, string] | null
    {
        const {
            asyncContextToOperations1, asyncContextToOperations2,
        } = raceConditionInfo;

        return [
            [
                JSON.stringify(asyncContextToOperations1[0].codeInfo),
                JSON.stringify(asyncContextToOperations2[0].codeInfo),
            ].join(','),
            [
                JSON.stringify(asyncContextToOperations2[0].codeInfo),
                JSON.stringify(asyncContextToOperations1[0].codeInfo),
            ].join(','),
        ];
    }

    private static getResourceInfoHash(resourceInfo: ResourceInfo): string | object
    {
        return resourceInfo.getHash();
    }
}