// DO NOT INSTRUMENT
class VariableDeclare
{
    /**
     * @param {string} name - variable/object field name
     * @param {Callback} scope - async scope in which the variable declared
     * @param {object|null} base - object field base object reference, null for primitives
     * */
    constructor(name, scope, base)
    {
        this.name = name;
        this.scope = scope; // 在哪个 scope 里面被创建，目前在引用类型上还不太准 TODO: 引用类型 scope 解决
        this.base = base;
        /**@type Map<Callback, VariableOperation[]>*/
        this.operations = new Map();
    }
}

module.exports = VariableDeclare;