// DO NOT INSTRUMENT

import {Detector} from './Detector';
import {ViolationInfo} from './ViolationInfo';
import {ResourceDeclaration} from '../LogStore/Class/ResourceDeclaration';
import {CallbackFunction} from '../LogStore/Class/CallbackFunction';
import {Filter} from './Filter';

/**
 * For curtain resourceDeclaration, which asyncIds have been reported forming violations
 * We do not need repeated violation reports for the same asyncId with multiple operations
 * */
const resourceDeclarationToProcessedAsyncIds = new Map<ResourceDeclaration, Set<number>>();

/**
 * lazy calculation
 */
const callbackFunctionToAsyncIdsCache = new Map<CallbackFunction, Set<number>>();

export const conservativeDetector: Detector = (resourceDeclaration) =>
{
    const callbackToOperations = resourceDeclaration.getCallbackFunctionToOperations();
    const LENGTH = callbackToOperations.size;
    if (LENGTH <= 2)    // no conflict if there are only 2 operations
    {
        return [];
    }

    const callbackToOperationsArray = Array.from(callbackToOperations.entries());

    const lastCallbackToOperation = callbackToOperationsArray[LENGTH - 1]!;
    const lastCallback = lastCallbackToOperation[0];

    // check if the callback has been processed for the resourceDeclaration
    const processedAsyncIds = resourceDeclarationToProcessedAsyncIds.get(resourceDeclaration);
    if (processedAsyncIds !== undefined && processedAsyncIds.has(lastCallback.asyncId))
    {
        return [];
    }

    /**
     * asyncId chain for the last callback
     * */
    let lastCallbackAsyncIds: Set<number> | undefined = callbackFunctionToAsyncIdsCache.get(lastCallback);
    if (lastCallbackAsyncIds === undefined)
    {
        lastCallbackAsyncIds = new Set();
        let currentCallback = lastCallback.asyncScope;
        while (currentCallback !== null)    // get the async id chain
        {
            lastCallbackAsyncIds.add(currentCallback.asyncId);
            currentCallback = currentCallback.asyncScope;
        }
        callbackFunctionToAsyncIdsCache.set(lastCallback, lastCallbackAsyncIds);
    }
    if (lastCallbackAsyncIds.has(CallbackFunction.UNKNOWN_ASYNC_ID))
    {
        return [];
    }

    let atomicPairIndex1 = -1;
    let atomicPairIndex2 = LENGTH - 1;
    let violatingOperationIndexes = [];

    // From the last to the first, check if another callback can form atomic pair with the last callback
    for (let i = callbackToOperationsArray.length - 2; i >= 0; i--)
    {
        if (callbackToOperationsArray[i]![0].asyncId !== CallbackFunction.UNKNOWN_ASYNC_ID  // ignore UNKNOWN due to the bug #471 in graaljs
            && lastCallbackAsyncIds.has(callbackToOperationsArray[i]![0].asyncId)) // on the chain
        {
            atomicPairIndex1 = i;
            break;
        }
    }
    if (atomicPairIndex1 === -1)
    {
        return [];
    }

    // check whether there is another callback between the atomic pair above writes to the resource
    for (let i = atomicPairIndex1 + 1; i < atomicPairIndex2; i++)
    {
        const callback = callbackToOperationsArray[i]![0];
        if (callback.getHasWriteOperation(resourceDeclaration)
            && callback.asyncId !== lastCallback.asyncId   // for setInterval callbacks, which have the same asyncId, and do not violate each other
            && callback.asyncId !== CallbackFunction.UNKNOWN_ASYNC_ID)  // ignore UNKNOWN
        {
            violatingOperationIndexes.push(i);
        }
    }
    if (violatingOperationIndexes.length === 0)
    {
        return [];
    }

    const violationInfos: ViolationInfo[] = [];

    for (const violatingOperationIndex of violatingOperationIndexes)
    {
        const violationInfo = new ViolationInfo(resourceDeclaration, [atomicPairIndex1, atomicPairIndex2], violatingOperationIndex);

        if (!Filter.hasReported(violationInfo))
        {
            if (Filter.changedSameFields(violationInfo))
            {
                resourceDeclarationToProcessedAsyncIds.set(resourceDeclaration,
                    (resourceDeclarationToProcessedAsyncIds.get(resourceDeclaration) ?? new Set<number>())
                        .add(lastCallback.asyncId));
                violationInfos.push(violationInfo);
                Filter.addReported(violationInfo);
            }
        }
    }

    return violationInfos;
};