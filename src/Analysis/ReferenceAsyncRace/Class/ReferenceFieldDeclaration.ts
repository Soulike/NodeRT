// DO NOT INSTRUMENT
import CallbackFunction from '../../Class/CallbackFunction';
import ReferenceFieldOperation from './ReferenceFieldOperation';

class ReferenceFieldDeclaration
{
    public readonly name: unknown;
    public readonly base: object;
    public readonly operations: Map<CallbackFunction, ReferenceFieldOperation[]>;

    constructor(name: unknown, base: object)
    {
        this.name = name;
        this.base = base;
        this.operations = new Map();
    }

    /**
     * Whether the access to the field <code>name</code> of <code>base</code> is logged by this <code>ReferenceFieldDeclaration</code>
     * */
    public is(name: unknown, base: object): boolean
    {
        return name === this.name && base === this.base;
    }
}

export default ReferenceFieldDeclaration;