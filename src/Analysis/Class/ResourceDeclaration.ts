// DO NOT INSTRUMENT

import ResourceOperation from './ResourceOperation';
import CallbackFunction from './CallbackFunction';

abstract class ResourceDeclaration
{
    public abstract appendOperation(currentCallbackFunction: CallbackFunction, resourceOperation: ResourceOperation): void;

    public abstract getOperations(): Map<CallbackFunction, ResourceOperation[]>;
}

export default ResourceDeclaration;