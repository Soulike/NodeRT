class VariableDeclare
{
    /**
     * @param {string} name
     * @param {Callback} scope
     * */
    constructor(name, scope)
    {
        this.name = name;
        this.scope = scope; // 在哪个 scope 里面被创建
        /**@type Map<Callback, VariableOperation[]>*/
        this.operations = new Map();
    }
}

module.exports = VariableDeclare;