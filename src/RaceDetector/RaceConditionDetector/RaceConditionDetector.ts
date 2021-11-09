import {Detector} from '../Detector';
import {RaceConditionInfo} from './RaceConditionInfo';
import {Filter} from './Filter';

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
    const [lastAsyncContext] = lastAsyncContentToOperations;
    const lastAsyncContextAsyncChain = lastAsyncContext.getAsyncContextChainAsyncIds();
    const hasWriteOperationOnResource = lastAsyncContext.getHasWriteOperationOn(resourceDeclaration);
    for (let i = LENGTH - 2; i >= 0; i--)
    {
        const currentAsyncContextToOperations = asyncContextToOperationsArray[i]!;
        const currentAsyncContext = currentAsyncContextToOperations[0];
        if (!lastAsyncContextAsyncChain.has(currentAsyncContext.asyncId))   // no happens-before
        {
            if (hasWriteOperationOnResource)    // current does write
            {
                raceConditionInfos.push(
                    new RaceConditionInfo(resourceInfo, currentAsyncContextToOperations, lastAsyncContentToOperations));
            }
            else if (currentAsyncContext.getHasWriteOperationOn(resourceDeclaration))    // another does write
            {
                raceConditionInfos.push(
                    new RaceConditionInfo(resourceInfo, currentAsyncContextToOperations, lastAsyncContentToOperations));
            }
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