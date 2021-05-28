// DO NOT INSTRUMENT
import Callback from './Callback';
import VariableOperation from './VariableOperation';

class VariableDeclare
{
    public readonly name: string;
    public readonly scope: Callback;  // 在哪个 scope 里面被创建，目前在引用类型上还不太准 TODO: 引用类型 scope 解决
    public readonly base: object | null;
    public readonly operations: Map<Callback, VariableOperation[]>;

    /**
     * @param name - variable/object field name
     * @param scope - async scope in which the variable declared
     * @param base - object field base object reference, null for primitives
     * */
    constructor(name: string, scope: Callback, base: object | null)
    {
        this.name = name;
        this.scope = scope;
        this.base = base;
        this.operations = new Map();
    }
}

export default VariableDeclare;