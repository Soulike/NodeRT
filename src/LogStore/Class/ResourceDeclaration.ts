// DO NOT INSTRUMENT

import {ResourceOperation} from './ResourceOperation';
import {CallbackFunction} from './CallbackFunction';

export abstract class ResourceDeclaration
{
    public abstract is(...other: unknown[]): boolean;

    public abstract appendOperation(currentCallbackFunction: CallbackFunction, resourceOperation: ResourceOperation): void;

    public abstract getOperations(): ReadonlyMap<CallbackFunction, ResourceOperation[]>;
}