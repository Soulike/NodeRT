// DO NOT INSTRUMENT

import {CallbackFunction} from '../Class/CallbackFunction';

/**
 * Global shared static class that logs callback function context information.
 * Should only be written by <code>AsyncContextLogger</code>
 * */
export class CallbackFunctionContext
{
    private static currentCallbackFunction: CallbackFunction = CallbackFunction.GLOBAL;

    public static getCurrentCallbackFunction(): Readonly<CallbackFunction>
    {
        return Object.freeze(CallbackFunctionContext.currentCallbackFunction);
    }

    public static setCurrentCallbackFunction(callbackFunction: CallbackFunction)
    {
        CallbackFunctionContext.currentCallbackFunction = callbackFunction;
    }
}