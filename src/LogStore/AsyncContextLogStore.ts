// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import {AsyncCalledFunctionInfo} from './Class/AsyncCalledFunctionInfo';

/**
 * Global shared static class that logs callback function context information.
 * Should only be written by <code>AsyncContextLogger</code>
 * */
export class AsyncContextLogStore
{
    // one async id may corresponding to multiple functions because of setInterval()
    private static readonly asyncIdToAsyncCalledFunctionInfo: Map<number, AsyncCalledFunctionInfo[]> = new Map([
        [AsyncCalledFunctionInfo.UNKNOWN_ASYNC_ID, [AsyncCalledFunctionInfo.UNKNOWN]],
        [AsyncCalledFunctionInfo.GLOBAL_ASYNC_ID, [AsyncCalledFunctionInfo.GLOBAL]],
    ]);

    public static setAsyncIdToAsyncContext(asyncId: number, asyncCalledFunctionInfo: AsyncCalledFunctionInfo)
    {
        const asyncCalledFunctionInfos = AsyncContextLogStore.asyncIdToAsyncCalledFunctionInfo.get(asyncId);
        if (asyncCalledFunctionInfos === undefined)
        {
            AsyncContextLogStore.asyncIdToAsyncCalledFunctionInfo.set(asyncId, [asyncCalledFunctionInfo]);
        }
        else
        {
            asyncCalledFunctionInfos.push(asyncCalledFunctionInfo);
        }
    }

    public static getAsyncContextFromAsyncId(asyncId: number): AsyncCalledFunctionInfo
    {
        const asyncCalledFunctionInfos = AsyncContextLogStore.asyncIdToAsyncCalledFunctionInfo.get(asyncId);
        assert.ok(asyncCalledFunctionInfos !== undefined);
        return asyncCalledFunctionInfos[asyncCalledFunctionInfos.length - 1]!;
    }

    public static getNonTickObjectAsyncContextFromAsyncId(asyncId: number): AsyncCalledFunctionInfo
    {
        const asyncCalledFunctionInfos = AsyncContextLogStore.asyncIdToAsyncCalledFunctionInfo.get(asyncId);
        assert.ok(asyncCalledFunctionInfos !== undefined);
        let asyncContext = asyncCalledFunctionInfos[asyncCalledFunctionInfos.length - 1]!;
        while (asyncContext.asyncType === 'TickObject')
        {
            asyncContext = asyncContext.asyncContext!;  // impossible to be null since global context is not TickObject
        }
        return asyncContext;
    }
}