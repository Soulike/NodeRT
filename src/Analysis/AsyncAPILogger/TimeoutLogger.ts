import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {AsyncContextLogStore} from '../../LogStore/AsyncContextLogStore';
import asyncHooks from 'async_hooks';
import {TimerLogStore} from '../../LogStore/TimerLogStore';
import {TimerInfo} from '../../LogStore/Class/TimerInfo';
import {AsyncCalledFunctionInfo} from '../../LogStore/Class/AsyncCalledFunctionInfo';
import {getUnboundFunction} from '../../Util';

export class TimeoutLogger extends Analysis
{
    public invokeFunPre: Hooks['invokeFunPre'] | undefined;
    public invokeFun: Hooks['invokeFun'] | undefined;

    private timeoutIdToCallbackInfo: WeakMap<ReturnType<typeof setTimeout>, { asyncContext: AsyncCalledFunctionInfo, callback: Function }>;
    private intervalIdToCallbackInfo: WeakMap<ReturnType<typeof setInterval>, { asyncContext: AsyncCalledFunctionInfo, callback: Function }>;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.timeoutIdToCallbackInfo = new WeakMap();
        this.intervalIdToCallbackInfo = new WeakMap();
    }

    protected override registerHooks()
    {
        this.invokeFunPre = (_iid, f, _base, args) =>
        {
            if (f === setTimeout || f === setInterval)
            {
                let [callback, delay] = args as Parameters<typeof setTimeout | typeof setInterval>;
                callback = getUnboundFunction(callback);
                if (delay === undefined || delay > 2147483647 || delay < 1)
                {
                    delay = 1;
                }
                delay = Math.floor(delay);

                const asyncContext = AsyncContextLogStore.getNonTickObjectAsyncContextFromAsyncId(asyncHooks.executionAsyncId());
                if (f === setTimeout)
                {
                    TimerLogStore.addTimerInfo(asyncContext, new TimerInfo(callback, delay, 'timeout'));
                }
                else
                {
                    TimerLogStore.addTimerInfo(asyncContext, new TimerInfo(callback, delay, 'interval'));
                }
            }
        };

        this.invokeFun = (_iid, f, _base, args, result) =>
        {
            if (f === setTimeout || f === setInterval)
            {
                let [callback] = args as Parameters<typeof setTimeout | typeof setInterval>;
                callback = getUnboundFunction(callback);
                const asyncContext = AsyncContextLogStore.getNonTickObjectAsyncContextFromAsyncId(asyncHooks.executionAsyncId());
                if (f === setTimeout)
                {
                    this.timeoutIdToCallbackInfo.set(result as ReturnType<typeof setTimeout>, {asyncContext, callback});
                }
                else
                {
                    this.intervalIdToCallbackInfo.set(result as ReturnType<typeof setInterval>, {
                        asyncContext,
                        callback,
                    });
                }
            }
            else if (f === clearTimeout)
            {
                const timeout = result as ReturnType<typeof setTimeout>;
                const callbackInfo = this.timeoutIdToCallbackInfo.get(timeout);
                if (callbackInfo !== undefined)
                {
                    TimerLogStore.deleteTimerInfo(callbackInfo.asyncContext, callbackInfo.callback);
                }
            }
            else if (f === clearInterval)
            {
                const interval = result as ReturnType<typeof setInterval>;
                const callbackInfo = this.timeoutIdToCallbackInfo.get(interval);
                if (callbackInfo !== undefined)
                {
                    TimerLogStore.deleteTimerInfo(callbackInfo.asyncContext, callbackInfo.callback);
                }
            }
        };
    }
}