import {Info} from '../Info';
import {ResourceInfo} from '../../LogStore/Class/ResourceInfo';
import {AsyncCalledFunctionInfo} from '../../LogStore/Class/AsyncCalledFunctionInfo';
import {ResourceOperation} from '../../LogStore/Class/ResourceOperation';

export class RaceConditionInfo extends Info
{
    public readonly asyncContentToOperations1: readonly [AsyncCalledFunctionInfo, readonly ResourceOperation[]];
    public readonly asyncContentToOperations2: readonly [AsyncCalledFunctionInfo, readonly ResourceOperation[]];

    constructor(resourceInfo: ResourceInfo,
                asyncContentToOperations1: RaceConditionInfo['asyncContentToOperations1'],
                asyncContentToOperations2: RaceConditionInfo['asyncContentToOperations2'])
    {
        super(resourceInfo);
        this.asyncContentToOperations1 = asyncContentToOperations1;
        this.asyncContentToOperations2 = asyncContentToOperations2;
    }
}