// DO NOT INSTRUMENT
class VariableOperation
{
    /**
     * @param {'read'|'write'} type
     * @param {any} value
     * */
    constructor(type, value)
    {
        this.type = type;
        this.value = value;
    }
}

module.exports = VariableOperation;