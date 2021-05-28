// DO NOT INSTRUMENT
class VariableOperation
{
    public readonly type: 'read' | 'write';
    public readonly value: unknown;

    /**
     * @param type
     * @param value
     * */
    constructor(type: 'read' | 'write', value: unknown)
    {
        this.type = type;
        this.value = value;
    }
}

export default VariableOperation;