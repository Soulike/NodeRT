// DO NOT INSTRUMENT

import {Detector} from './Detector';
import {shouldOutput} from './Util';
import {ViolationInfo} from './ViolationInfo';
import {ResourceDeclaration} from '../LogStore/Class/ResourceDeclaration';

/**
 * For curtain resourceDeclaration, which asyncIds have been reported forming violations
 * We do not need repeated violation reports for the same asyncId with multiple operations
 * */
const resourceDeclarationToProcessedAsyncIds = new WeakMap<ResourceDeclaration, Set<number>>();

export const conservativeDetector: Detector = (resourceDeclaration) =>
{
    const callbackToOperations = resourceDeclaration.getCallbackFunctionToOperations();
    const LENGTH = callbackToOperations.size;
    if (LENGTH <= 2)    // no conflict if there are only 2 operations
    {
        return null;
    }

    const callbackToOperationsArray = Array.from(callbackToOperations.entries());

    const lastCallbackToOperation = callbackToOperationsArray[LENGTH - 1]!;
    const lastCallback = lastCallbackToOperation[0];

    // check if the callback has been processed for the resourceDeclaration
    const processedAsyncIds = resourceDeclarationToProcessedAsyncIds.get(resourceDeclaration);
    if (processedAsyncIds === undefined)
    {
        resourceDeclarationToProcessedAsyncIds.set(resourceDeclaration, new Set([lastCallback.asyncId]));
    }
    else if (processedAsyncIds.has(lastCallback.asyncId))
    {
        return null;
    }

    /**
     * asyncId chain for the last callback
     * */
    const lastCallbackAsyncIds: Set<number> = new Set();
    let currentCallback = lastCallback.asyncScope;
    while (currentCallback !== null)    // get the async id chain
    {
        lastCallbackAsyncIds.add(currentCallback.asyncId);
        currentCallback = currentCallback.asyncScope;
    }

    let atomicPairIndex1 = -1;
    let atomicPairIndex2 = LENGTH - 1;
    let violatingOperationIndex = -1;

    // From the last to the first, check if another callback can form atomic pair with the last callback
    for (let i = callbackToOperationsArray.length - 2; i >= 0; i--)
    {
        if (lastCallbackAsyncIds.has(callbackToOperationsArray[i]![0].asyncId)) // on the chain
        {
            atomicPairIndex1 = i;
            break;
        }
    }
    if (atomicPairIndex1 === -1)
    {
        return null;
    }

    // check whether there is another callback between the atomic pair above writes to the resource
    for (let i = atomicPairIndex1 + 1; i < atomicPairIndex2; i++)
    {
        const operations = callbackToOperationsArray[i]![1];
        const callback = callbackToOperationsArray[i]![0];
        if (!operations.every(operation => operation.getType() !== 'write')
            && callback.asyncId !== lastCallback.asyncId)   // for setInterval callbacks, which have the same asyncId, and do not violate each other
        {
            violatingOperationIndex = i;
            break;
        }
    }
    if (violatingOperationIndex === -1)
    {
        return null;
    }

    const violationInfo = new ViolationInfo(resourceDeclaration, [atomicPairIndex1, atomicPairIndex2], violatingOperationIndex);

    if (shouldOutput(violationInfo, callbackToOperationsArray))
    {
        resourceDeclarationToProcessedAsyncIds.set(resourceDeclaration,
            (resourceDeclarationToProcessedAsyncIds.get(resourceDeclaration) ?? new Set<number>())
                .add(lastCallback.asyncId));
        return violationInfo;
    }
    else
    {
        return null;
    }
};