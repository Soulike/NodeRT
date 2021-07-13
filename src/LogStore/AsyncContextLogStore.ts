// DO NOT INSTRUMENT

import {CallbackFunction} from './Class/CallbackFunction';

/**
 * Global shared static class that logs callback function context information.
 * Should only be written by <code>AsyncContextLogger</code>
 * */
export class AsyncContextLogStore
{
    private static currentCallbackFunction: CallbackFunction = CallbackFunction.GLOBAL;

    public static getCurrentCallbackFunction(): Readonly<CallbackFunction>
    {
        return Object.freeze(AsyncContextLogStore.currentCallbackFunction);
    }

    public static setCurrentCallbackFunction(callbackFunction: CallbackFunction)
    {
        AsyncContextLogStore.currentCallbackFunction = callbackFunction;
    }
}