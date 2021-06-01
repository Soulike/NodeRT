// DO NOT INSTRUMENT

import CallbackFunction from '../../Class/CallbackFunction';
import ObjectFieldOperation from './ObjectFieldOperation';
import ResourceDeclaration from '../../Class/ResourceDeclaration';

class ObjectFieldDeclaration extends ResourceDeclaration
{
    private readonly name: unknown;
    private readonly base: object;
    private readonly operations: Map<CallbackFunction, ObjectFieldOperation[]>;

    constructor(name: unknown, base: object)
    {
        super();
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

    public getOperations()
    {
        return new Map(this.operations);
    }
}

export default ObjectFieldDeclaration;