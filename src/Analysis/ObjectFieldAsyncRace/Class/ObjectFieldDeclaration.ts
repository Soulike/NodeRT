// DO NOT INSTRUMENT

import CallbackFunction from '../../Class/CallbackFunction';
import ObjectFieldOperation from './ObjectFieldOperation';
import ResourceDeclaration from '../../Interface/ResourceDeclaration';

class ObjectFieldDeclaration implements ResourceDeclaration
{
    public readonly name: unknown;
    public readonly base: object;
    public readonly operations: Map<CallbackFunction, ObjectFieldOperation[]>;

    constructor(name: unknown, base: object)
    {
        this.name = name;
        this.base = base;
        this.operations = new Map();
    }

    /**
     * Whether the access to the field <code>name</code> of <code>base</code> is logged by this <code>ObjectFieldDeclaration</code>
     * */
    public is(name: unknown, base: object): boolean
    {
        return name === this.name && base === this.base;
    }

    public appendOperation(currentCallbackFunction: CallbackFunction, objectFieldOperation: ObjectFieldOperation)
    {
        const objectFieldOperations = this.operations.get(currentCallbackFunction);
        if (objectFieldOperations === undefined)
        {
            this.operations.set(currentCallbackFunction, [objectFieldOperation]);
        }
        else
        {
            objectFieldOperations.push(objectFieldOperation);
        }
    }
}

export default ObjectFieldDeclaration;