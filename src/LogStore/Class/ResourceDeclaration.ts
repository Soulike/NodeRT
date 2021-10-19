// DO NOT INSTRUMENT

import {ResourceOperation} from './ResourceOperation';
import {AsyncCalledFunctionInfo} from './AsyncCalledFunctionInfo';

export abstract class ResourceDeclaration
{
    public abstract is(...other: unknown[]): boolean;

    public abstract appendOperation(currentAsyncContext: AsyncCalledFunctionInfo, resourceOperation: ResourceOperation): void;

    public abstract getAsyncContextToOperations(): ReadonlyMap<AsyncCalledFunctionInfo, ReadonlyArray<ResourceOperation>>;
}