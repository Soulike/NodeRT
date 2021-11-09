// DO NOT INSTRUMENT

import {ResourceInfo} from '../../LogStore/Class/ResourceInfo';
import {AsyncCalledFunctionInfo} from '../../LogStore/Class/AsyncCalledFunctionInfo';
import {ResourceOperation} from '../../LogStore/Class/ResourceOperation';
import {Info} from '../Info';

export class ViolationInfo extends Info
{
    public readonly atomicAsyncContextToOperations1: readonly [AsyncCalledFunctionInfo, readonly ResourceOperation[]];
    public readonly atomicAsyncContextToOperations2: readonly [AsyncCalledFunctionInfo, readonly ResourceOperation[]];
    public readonly violatingAsyncContextToOperations: readonly [AsyncCalledFunctionInfo, readonly ResourceOperation[]];

    constructor(resourceInfo: ResourceInfo,
                atomicAsyncContextToOperations1: readonly [AsyncCalledFunctionInfo, readonly ResourceOperation[]],
                atomicAsyncContextToOperations2: readonly [AsyncCalledFunctionInfo, readonly ResourceOperation[]],
                violatingAsyncContextToOperations: readonly  [AsyncCalledFunctionInfo, readonly ResourceOperation[]])
    {
        super(resourceInfo);
        this.atomicAsyncContextToOperations1 = atomicAsyncContextToOperations1;
        this.atomicAsyncContextToOperations2 = atomicAsyncContextToOperations2;
        this.violatingAsyncContextToOperations = violatingAsyncContextToOperations;
    }
}