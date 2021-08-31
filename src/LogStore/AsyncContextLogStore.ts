// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import {CallbackFunction} from './Class/CallbackFunction';

/**
 * Global shared static class that logs callback function context information.
 * Should only be written by <code>AsyncContextLogger</code>
 * */
export class AsyncContextLogStore
{
    private static readonly asyncIdToFunctionCall: Map<number, CallbackFunction> = new Map([
        [CallbackFunction.UNKNOWN_ASYNC_ID, CallbackFunction.UNKNOWN],
        [CallbackFunction.GLOBAL_ASYNC_ID, CallbackFunction.GLOBAL],
    ]);

    public static setAsyncIdToFunctionCall(asyncId: number, functionCall: CallbackFunction)
    {
        AsyncContextLogStore.asyncIdToFunctionCall.set(asyncId, functionCall);
    }

    public static getFunctionCallFromAsyncId(asyncId: number): CallbackFunction
    {
        const callbackFunction = AsyncContextLogStore.asyncIdToFunctionCall.get(asyncId);
        assert.ok(callbackFunction !== undefined);
        return callbackFunction;
    }
}