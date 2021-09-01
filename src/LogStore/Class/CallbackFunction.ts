// DO NOT INSTRUMENT

import {SourceCodeInfo} from './SourceCodeInfo';

export class CallbackFunction
{
    public static readonly UNKNOWN_ASYNC_ID = 0;
    public static readonly UNKNOWN = new CallbackFunction(null, null, CallbackFunction.UNKNOWN_ASYNC_ID, 'UNKNOWN', null, null);

    public static readonly GLOBAL_ASYNC_ID = 1;
    public static readonly GLOBAL = new CallbackFunction(null, null, CallbackFunction.GLOBAL_ASYNC_ID, 'GLOBAL', null, null);

    public readonly functionWeakRef: WeakRef<Function> | null;
    public readonly stackTrace: string[] | null;
    public readonly asyncId: number;
    public readonly type: string;
    public asyncScope: CallbackFunction | null;    // null for global
    public readonly registerCodeInfo: SourceCodeInfo | null;

    constructor(func: Function | null, stackTrace: string[] | null, asyncId: number, type: string, asyncScope: CallbackFunction | null, registerCodeInfo: SourceCodeInfo | null)
    {
        this.functionWeakRef = func !== null ? new WeakRef(func) : null;
        this.stackTrace = stackTrace;
        this.asyncId = asyncId;
        this.type = type;
        this.asyncScope = asyncScope; // 被创建时所在的 scope
        this.registerCodeInfo = registerCodeInfo;   // 本 callback 是被什么地方的代码注册执行的
    }

    /** Whether asyncScope chain is a sub chain of 'this.asyncScope'. e.g. a->b->c is in async scope a->b */
    isInAsyncScope(asyncScope: CallbackFunction): boolean
    {
        if (asyncScope === CallbackFunction.GLOBAL || asyncScope === CallbackFunction.UNKNOWN || this === asyncScope)
        {
            return true;
        }
        if (this === CallbackFunction.GLOBAL || this === CallbackFunction.UNKNOWN)
        {
            return false;
        }
        return this.asyncScope!.isInAsyncScope(asyncScope);
    }
}