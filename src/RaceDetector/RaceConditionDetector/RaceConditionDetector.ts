import {Detector} from '../Detector';
import {RaceConditionInfo} from './RaceConditionInfo';
import {Filter} from './Filter';
import {AsyncCalledFunctionInfo} from '../../LogStore/Class/AsyncCalledFunctionInfo';

export const raceConditionDetector: Detector = resourceDeclaration =>
{
    const asyncContextToOperationsArray = Object.freeze(Array.from(resourceDeclaration.getAsyncContextToOperations()));
    const LENGTH = asyncContextToOperationsArray.length;
    if (LENGTH <= 1)    // no race if there are only 1 operation
    {
        return [];
    }

    const raceConditionInfos: RaceConditionInfo[] = [];

    const resourceInfo = resourceDeclaration.getResourceInfo();
    const lastAsyncContentToOperations = asyncContextToOperationsArray[LENGTH - 1]!;
    const lastAsyncContentOperations = lastAsyncContentToOperations[1];
    const [lastAsyncContext] = lastAsyncContentToOperations;
    const lastAsyncContextAsyncChain = lastAsyncContext.getAsyncContextChainAsyncIds();
    const hasWriteOperationOnResource = lastAsyncContext.getHasWriteOperationOn(resourceDeclaration);

    for (let i = LENGTH - 2; i >= 0; i--)
    {
        const beforeLastAsyncContextToOperations = asyncContextToOperationsArray[i]!;
        const beforeLastAsyncContext = beforeLastAsyncContextToOperations[0];
        const beforeLastAsyncContextAsyncChain = beforeLastAsyncContext.getAsyncContextChainAsyncIds();
        const beforeLastAsyncContextOperations = beforeLastAsyncContextToOperations[1];

        const timeDiff = lastAsyncContentOperations[lastAsyncContentOperations.length - 1]!.getTimestamp()
            - beforeLastAsyncContextOperations[beforeLastAsyncContextOperations.length - 1]!.getTimestamp();

        if (lastAsyncContextAsyncChain.has(AsyncCalledFunctionInfo.UNKNOWN_ASYNC_ID) || beforeLastAsyncContextAsyncChain.has(AsyncCalledFunctionInfo.UNKNOWN_ASYNC_ID)) // ignore UNKNOWN_ASYNC_ID
        {
            continue;
        }

        if (!lastAsyncContextAsyncChain.has(beforeLastAsyncContext.getNonTickObjectAsyncId())
            && !beforeLastAsyncContextAsyncChain.has(lastAsyncContext.getNonTickObjectAsyncId()))   // no happens-before
        {
            if (hasWriteOperationOnResource)    // current does write
            {
                raceConditionInfos.push(
                    new RaceConditionInfo(resourceInfo, beforeLastAsyncContextToOperations, lastAsyncContentToOperations, timeDiff));
            }
            else if (beforeLastAsyncContext.getHasWriteOperationOn(resourceDeclaration))    // another does write
            {
                raceConditionInfos.push(
                    new RaceConditionInfo(resourceInfo, beforeLastAsyncContextToOperations, lastAsyncContentToOperations, timeDiff));
            }
        }
        else if (hasWriteOperationOnResource === beforeLastAsyncContext.getHasWriteOperationOn(resourceDeclaration))
        {
            break;
        }
    }

    return raceConditionInfos.filter(raceConditionInfo =>
    {
        const shouldReport = !Filter.hasReported(resourceDeclaration, raceConditionInfo)
            && Filter.isTruePositive(raceConditionInfo);
        if (shouldReport)
        {
            Filter.addReported(resourceDeclaration, raceConditionInfo);
        }
        return shouldReport;
    });
};