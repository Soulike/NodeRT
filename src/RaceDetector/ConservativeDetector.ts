// DO NOT INSTRUMENT

import {CallbackFunction} from '../LogStore/Class/CallbackFunction';
import {Detector} from './Detector';
import {shouldOutput} from './Util';
import {ViolationInfo} from './ViolationInfo';

const checkedCallbacks: WeakSet<CallbackFunction> = new WeakSet();

export const conservativeDetector: Detector = (resourceDeclaration) =>
{
    const callbackToOperations = resourceDeclaration.getCallbackFunctionToOperations();
    const LENGTH = callbackToOperations.size;
    if (LENGTH <= 2)
    {
        return null;
    }

    const callbackToOperationsArray = Array.from(callbackToOperations.entries());

    const lastCallbackToOperation = callbackToOperationsArray[LENGTH - 1]!;
    const lastCallback = lastCallbackToOperation[0];

    if (checkedCallbacks.has(lastCallback))
    {
        return null;
    }

    const lastCallbackAsyncIds: Set<number> = new Set();
    let currentCallback = lastCallback.asyncScope;
    while (currentCallback !== null)
    {
        lastCallbackAsyncIds.add(currentCallback.asyncId);
        currentCallback = currentCallback.asyncScope;
    }

    let atomicPairIndex1 = -1;
    let atomicPairIndex2 = LENGTH - 1;
    let violatingOperationIndex = -1;

    for (let i = callbackToOperationsArray.length - 2; i >= 0; i--)
    {
        if (lastCallbackAsyncIds.has(callbackToOperationsArray[i]![0].asyncId))
        {
            atomicPairIndex1 = i;
            break;
        }
    }
    if (atomicPairIndex1 === -1)
    {
        return null;
    }

    for (let i = atomicPairIndex1 + 1; i < atomicPairIndex2; i++)
    {
        const operations = callbackToOperationsArray[i]![1];
        const callback = callbackToOperationsArray[i]![0];
        if (!operations.every(operation => operation.getType() !== 'write')
            && callback.asyncId !== lastCallback.asyncId)   // for setInterval callbacks
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
        checkedCallbacks.add(callbackToOperationsArray[violatingOperationIndex]![0]);
        return violationInfo;
    }
    else
    {
        return null;
    }
};