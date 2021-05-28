// DO NOT INSTRUMENT
import CallbackType from '../Type/CallbackType';
import SourceCodeInfo from './SourceCodeInfo';

class Callback
{
    public readonly funcName: 'global' | 'anonymous' | string;   // for debug
    public readonly func: Function | null;
    public readonly type: CallbackType;
    public readonly scope: Callback | null;
    public readonly register: SourceCodeInfo | null;

    /**
     * @param func
     * @param type
     * @param scope
     * @param register
     * */
    constructor(func: Function | null, type: CallbackType, scope: Callback | null, register: SourceCodeInfo | null)
    {
        this.funcName = func === null ? 'global' : func.name.length !== 0 ? func.name : 'anonymous';
        this.func = func;
        this.type = type;
        this.scope = scope; // 被创建时所在的 scope
        this.register = register;   // 本 callback 是被什么地方的代码注册执行的
    }
}

export default Callback;