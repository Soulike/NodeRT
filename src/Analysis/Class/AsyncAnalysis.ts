// DO NOT INSTRUMENT
import Analysis from '../../Type/Analysis';
import Sandbox from '../../Type/Sandbox';
import CallbackFunction from './CallbackFunction';

class AsyncAnalysis extends Analysis
{
    private currentCallbackFunction: CallbackFunction;
    private pendingCallbackFunctions: CallbackFunction[]; // TODO: clean dead callbacks

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.currentCallbackFunction = CallbackFunction.GLOBAL;
        this.pendingCallbackFunctions = [];
    }

    public getCurrentCallbackFunction(): Readonly<CallbackFunction>
    {
        return Object.freeze(this.currentCallbackFunction);
    }

    public setCurrentCallbackFunction(callbackFunction: CallbackFunction)
    {
        this.currentCallbackFunction = callbackFunction;
    }

    public getPendingCallbackFunctionsClone()
    {
        return Array.from(this.pendingCallbackFunctions);
    }

    public pushToPendingCallbackFunctions(callbackFunction: CallbackFunction)
    {
        this.pendingCallbackFunctions.push(callbackFunction);
    }

    public removeFromPendingCallbackFunctions(index: number)
    {
        this.pendingCallbackFunctions = [...this.pendingCallbackFunctions.slice(0, index), ...this.pendingCallbackFunctions.slice(index + 1)];
    }
}

export default AsyncAnalysis;