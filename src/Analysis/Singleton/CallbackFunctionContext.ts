// DO NOT INSTRUMENT
import CallbackFunction from '../Class/CallbackFunction';

/**
 * Global shared static class that logs callback function context information.
 * Should only be written by <code>AsyncContentAnalysis</code>
 * */
class CallbackFunctionContext
{
    private static currentCallbackFunction: CallbackFunction = CallbackFunction.GLOBAL;
    private static pendingCallbackFunctions: CallbackFunction[] = []; // TODO: clean dead callbacks

    public static getCurrentCallbackFunction(): Readonly<CallbackFunction>
    {
        return Object.freeze(CallbackFunctionContext.currentCallbackFunction);
    }

    public static setCurrentCallbackFunction(callbackFunction: CallbackFunction)
    {
        CallbackFunctionContext.currentCallbackFunction = callbackFunction;
    }

    public static getPendingCallbackFunctionsClone()
    {
        return Array.from(CallbackFunctionContext.pendingCallbackFunctions);
    }

    public static pushToPendingCallbackFunctions(callbackFunction: CallbackFunction)
    {
        CallbackFunctionContext.pendingCallbackFunctions.push(callbackFunction);
    }

    public static removeFromPendingCallbackFunctions(index: number)
    {
        CallbackFunctionContext.pendingCallbackFunctions = [
            ...CallbackFunctionContext.pendingCallbackFunctions.slice(0, index),
            ...CallbackFunctionContext.pendingCallbackFunctions.slice(index + 1)];
    }
}

export default CallbackFunctionContext;