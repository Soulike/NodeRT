// DO NOT INSTRUMENT
import CallbackFunctionType from '../Type/CallbackFunctionType';
import SourceCodeInfo from './SourceCodeInfo';

class CallbackFunction
{
    public static readonly GLOBAL = new CallbackFunction(null, 'global', null, null);

    public readonly func: Function | null;
    public readonly type: CallbackFunctionType;
    public readonly asyncScope: CallbackFunction | null;    // null for global
    public readonly registerCodeInfo: SourceCodeInfo | null;

    constructor(func: Function | null, type: CallbackFunctionType, asyncScope: CallbackFunction | null, registerCodeInfo: SourceCodeInfo | null)
    {
        this.func = func;
        this.type = type;
        this.asyncScope = asyncScope; // 被创建时所在的 scope
        this.registerCodeInfo = registerCodeInfo;   // 本 callback 是被什么地方的代码注册执行的
    }

    /** Whether asyncScope chain is a sub chain of 'this.asyncScope'. e.g. a->b->c is in async scope a->b */
    isInAsyncScope(asyncScope: CallbackFunction): boolean
    {
        if (asyncScope === CallbackFunction.GLOBAL || this === asyncScope)
        {
            return true;
        }
        if (this === CallbackFunction.GLOBAL)
        {
            return false;
        }
        return this.asyncScope!.isInAsyncScope(asyncScope);
    }
}

export default CallbackFunction;