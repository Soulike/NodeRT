// DO NOT INSTRUMENT

import {Detector} from './Detector';
import {ViolationInfo} from './ViolationInfo';
import {AsyncCalledFunctionInfo} from '../LogStore/Class/AsyncCalledFunctionInfo';
import {Filter} from './Filter';

export const conservativeDetector: Detector = (resourceDeclaration) =>
{
    const asyncContextToOperations = Object.freeze(Array.from(resourceDeclaration.getAsyncContextToOperations()));
    const LENGTH = asyncContextToOperations.length;
    if (LENGTH <= 2)    // no conflict if there are only 2 operations
    {
        return [];
    }

    const lastAsyncContextToOperation = asyncContextToOperations[LENGTH - 1]!;
    const lastAsyncContext = lastAsyncContextToOperation[0];

    const lastAsyncContextAsyncIds = lastAsyncContext.getAsyncContextChainAsyncIds();
    if (lastAsyncContextAsyncIds.has(AsyncCalledFunctionInfo.UNKNOWN_ASYNC_ID)) // ignore asyncId=0 due to GraalVM bug
    {
        return [];
    }

    let atomicAsyncContextToOperations1Index = -1;
    let atomicAsyncContextToOperations2Index = LENGTH - 1;
    let violatingAsyncContextToOperationsIndexes = [];

    // From the last to the first, check if another callback can form atomic pair with the last callback
    for (let i = LENGTH - 2; i >= 0; i--)
    {
        const asyncContext = asyncContextToOperations[i]![0];
        if (asyncContext.asyncId !== AsyncCalledFunctionInfo.UNKNOWN_ASYNC_ID  // ignore UNKNOWN due to the bug #471 in graaljs
            && lastAsyncContextAsyncIds.has(asyncContext.asyncId)) // on the chain
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
        const asyncContext = asyncContextToOperations[i]![0];
        if (asyncContext.getHasWriteOperationOn(resourceDeclaration)
            && asyncContext.asyncId !== lastAsyncContext.asyncId   // for setInterval callbacks, which have the same asyncId, and do not violate each other
            && asyncContext.asyncId !== AsyncCalledFunctionInfo.UNKNOWN_ASYNC_ID)  // ignore UNKNOWN
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
            asyncContextToOperations[atomicAsyncContextToOperations1Index]!,
            asyncContextToOperations[atomicAsyncContextToOperations2Index]!,
            asyncContextToOperations[violatingAsyncContextToOperationsIndex]!);

        if (!Filter.hasReported(resourceDeclaration, violationInfo))
        {
            if (Filter.isTruePositive(violationInfo))
            {
                violationInfos.push(violationInfo);
                Filter.addReported(resourceDeclaration, violationInfo);
            }
        }
    }

    return violationInfos;
};