// DO NOT INSTRUMENT

import ResourceDeclaration from '../../Class/ResourceDeclaration';
import CallbackFunction from '../../Class/CallbackFunction';
import ObjectOperation from './ObjectOperation';

class ObjectDeclaration extends ResourceDeclaration
{
    private readonly object: object | Function;
    private readonly operations: Map<CallbackFunction, ObjectOperation[]>;

    constructor(object: object | Function)
    {
        super();
        this.object = object;
        this.operations = new Map();
    }

    public is(other: object | Function)
    {
        return other === this.object;
    }

    public appendOperation(currentCallbackFunction: CallbackFunction, objectOperation: ObjectOperation): void
    {
        const objectFieldOperations = this.operations.get(currentCallbackFunction);
        if (objectFieldOperations === undefined)
        {
            this.operations.set(currentCallbackFunction, [objectOperation]);
        }
        else
        {
            objectFieldOperations.push(objectOperation);
        }
    }

    public getOperations(): Map<CallbackFunction, ObjectOperation[]>
    {
        return new Map(this.operations);
    }

}

export default ObjectDeclaration;