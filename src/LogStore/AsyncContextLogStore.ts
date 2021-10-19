// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import {AsyncCalledFunctionInfo} from './Class/AsyncCalledFunctionInfo';

/**
 * Global shared static class that logs callback function context information.
 * Should only be written by <code>AsyncContextLogger</code>
 * */
export class AsyncContextLogStore
{
    private static readonly asyncIdToAsyncCalledFunctionInfo: Map<number, AsyncCalledFunctionInfo> = new Map([
        [AsyncCalledFunctionInfo.UNKNOWN_ASYNC_ID, AsyncCalledFunctionInfo.UNKNOWN],
        [AsyncCalledFunctionInfo.GLOBAL_ASYNC_ID, AsyncCalledFunctionInfo.GLOBAL],
    ]);

    public static setAsyncIdToAsyncContext(asyncId: number, asyncCalledFunctionInfo: AsyncCalledFunctionInfo)
    {
        AsyncContextLogStore.asyncIdToAsyncCalledFunctionInfo.set(asyncId, asyncCalledFunctionInfo);
    }

    public static getAsyncContextFromAsyncId(asyncId: number): AsyncCalledFunctionInfo
    {
        const asyncContext = AsyncContextLogStore.asyncIdToAsyncCalledFunctionInfo.get(asyncId);
        assert.ok(asyncContext !== undefined);
        return asyncContext;
    }
}