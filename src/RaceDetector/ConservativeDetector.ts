// DO NOT INSTRUMENT

import {Detector} from './Detector';
import {ViolationInfo} from './ViolationInfo';
import {ResourceDeclaration} from '../LogStore/Class/ResourceDeclaration';
import {AsyncCalledFunctionInfo} from '../LogStore/Class/AsyncCalledFunctionInfo';
import {Filter} from './Filter';

/**
 * For curtain resourceDeclaration, which asyncIds have been reported forming violations
 * We do not need repeated violation reports for the same asyncId with multiple operations
 * */
const resourceDeclarationToProcessedAsyncIds = new Map<ResourceDeclaration, Set<number>>();

/**
 * lazy calculation
 */
const asyncContextToAsyncIdsCache = new Map<AsyncCalledFunctionInfo, Set<number>>();

export const conservativeDetector: Detector = (resourceDeclaration) =>
{
    const asyncContextToOperations = resourceDeclaration.getAsyncContextToOperations();
    const LENGTH = asyncContextToOperations.size;
    if (LENGTH <= 2)    // no conflict if there are only 2 operations
    {
        return [];
    }

    const asyncContextToOperationsArray = Array.from(asyncContextToOperations.entries());

    const lastAsyncContextToOperation = asyncContextToOperationsArray[LENGTH - 1]!;
    const lastAsyncContext = lastAsyncContextToOperation[0];

    // check if the callback has been processed for the resourceDeclaration
    const processedAsyncIds = resourceDeclarationToProcessedAsyncIds.get(resourceDeclaration);
    if (processedAsyncIds !== undefined && processedAsyncIds.has(lastAsyncContext.asyncId))
    {
        return [];
    }

    /**
     * asyncId chain for the last callback
     * */
    let lastAsyncContextAsyncIds: Set<number> | undefined = asyncContextToAsyncIdsCache.get(lastAsyncContext);
    if (lastAsyncContextAsyncIds === undefined) // cache miss
    {
        lastAsyncContextAsyncIds = new Set();
        let currentAsyncContext = lastAsyncContext.asyncContext;
        while (currentAsyncContext !== null)    // get the async id chain
        {
            lastAsyncContextAsyncIds.add(currentAsyncContext.asyncId);
            currentAsyncContext = currentAsyncContext.asyncContext;
        }
        asyncContextToAsyncIdsCache.set(lastAsyncContext, lastAsyncContextAsyncIds); // cache set
    }

    if (lastAsyncContextAsyncIds.has(AsyncCalledFunctionInfo.UNKNOWN_ASYNC_ID)) // ignore asyncId=0 due to GraalVM bug
    {
        return [];
    }

    let atomicAsyncContextToOperations1Index = -1;
    let atomicAsyncContextToOperations2Index = LENGTH - 1;
    let violatingAsyncContextToOperationsIndexes = [];

    // From the last to the first, check if another callback can form atomic pair with the last callback
    for (let i = asyncContextToOperationsArray.length - 2; i >= 0; i--)
    {
        if (asyncContextToOperationsArray[i]![0].asyncId !== AsyncCalledFunctionInfo.UNKNOWN_ASYNC_ID  // ignore UNKNOWN due to the bug #471 in graaljs
            && lastAsyncContextAsyncIds.has(asyncContextToOperationsArray[i]![0].asyncId)) // on the chain
        {
            atomicAsyncContextToOperations1Index = i;
            break;
        }
    }
    if (atomicAsyncContextToOperations1Index === -1)
    {
        return [];
    }

    // check whether there is another callback between the atomic pair above writes to the resource
    for (let i = atomicAsyncContextToOperations1Index + 1; i < atomicAsyncContextToOperations2Index; i++)
    {
        const callback = asyncContextToOperationsArray[i]![0];
        if (callback.getHasWriteOperation(resourceDeclaration)
            && callback.asyncId !== lastAsyncContext.asyncId   // for setInterval callbacks, which have the same asyncId, and do not violate each other
            && callback.asyncId !== AsyncCalledFunctionInfo.UNKNOWN_ASYNC_ID)  // ignore UNKNOWN
        {
            violatingAsyncContextToOperationsIndexes.push(i);
        }
    }
    if (violatingAsyncContextToOperationsIndexes.length === 0)
    {
        return [];
    }

    const violationInfos: ViolationInfo[] = [];

    for (const violatingAsyncContextToOperationsIndex of violatingAsyncContextToOperationsIndexes)
    {
        const violationInfo = new ViolationInfo(resourceDeclaration.getResourceInfo(),
            asyncContextToOperationsArray[atomicAsyncContextToOperations1Index]!,
            asyncContextToOperationsArray[atomicAsyncContextToOperations2Index]!,
            asyncContextToOperationsArray[violatingAsyncContextToOperationsIndex]!);

        if (!Filter.hasReported(resourceDeclaration, violationInfo))
        {
            if (Filter.changedSameFields(violationInfo))
            {
                resourceDeclarationToProcessedAsyncIds.set(resourceDeclaration,
                    (resourceDeclarationToProcessedAsyncIds.get(resourceDeclaration) ?? new Set<number>())
                        .add(lastAsyncContext.asyncId));
                violationInfos.push(violationInfo);
                Filter.addReported(resourceDeclaration, violationInfo);
            }
        }
    }

    return violationInfos;
};