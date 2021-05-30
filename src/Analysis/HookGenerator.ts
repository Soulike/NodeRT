// DO NOT INSTRUMENT
import CallbackFunction from './Class/CallbackFunction';
import EventEmitter from 'events';
import Hooks from '../Type/Hooks';
import SourceCodeInfo from './Class/SourceCodeInfo';
import Range from './Class/Range';
import AsyncAnalysis from './Class/AsyncAnalysis';

export const asyncApiInvokeFunPreGenerator = (asyncAnalysis: AsyncAnalysis): Hooks['invokeFunPre'] =>
{
    return (iid, f, base, args, isConstructor, isMethod, functionIid, functionSid) =>
    {
        const sandbox = asyncAnalysis.getSandbox();
        const currentCallbackFunction = asyncAnalysis.getCurrentCallbackFunction();
        const {
            name,
            range,
        } = sandbox.iidToSourceObject(iid);
        const register = new SourceCodeInfo(name, new Range(range[0], range[1]));
        if (f === setTimeout)
        {
            const callback = args[0] as Function;
            asyncAnalysis.pushToPendingCallbackFunctions(new CallbackFunction(callback, 'timeout', currentCallbackFunction, register));
        }
        else if (f === setImmediate)
        {
            const callback = args[0] as Function;
            asyncAnalysis.pushToPendingCallbackFunctions(new CallbackFunction(callback, 'immediate', currentCallbackFunction, register));
        }
        else if (f === setInterval)
        {
            const callback = args[0] as Function;
            asyncAnalysis.pushToPendingCallbackFunctions(new CallbackFunction(callback, 'interval', currentCallbackFunction, register));
        }
        else if (f === process.nextTick)
        {
            const callback = args[0] as Function;
            asyncAnalysis.pushToPendingCallbackFunctions(new CallbackFunction(callback, 'nextTick', currentCallbackFunction, register));
        }
        else if (f === Promise.prototype.then)
        {
            const resolve = args[0];
            const reject = args[1];
            if (typeof resolve === 'function')
            {
                asyncAnalysis.pushToPendingCallbackFunctions(new CallbackFunction(resolve, 'promiseThen', currentCallbackFunction, register));
            }
            if (typeof reject === 'function')
            {
                asyncAnalysis.pushToPendingCallbackFunctions(new CallbackFunction(reject, 'promiseThen', currentCallbackFunction, register));
            }
        }
        else if (f === Promise.prototype.catch || f === Promise.prototype.finally)
        {
            const callback = args[1];
            if (typeof callback === 'function')
            {
                asyncAnalysis.pushToPendingCallbackFunctions(new CallbackFunction(callback, 'promiseThen', currentCallbackFunction, register));
            }
        }
        else if (f === EventEmitter.prototype.on)
        {
            const callback = args[1] as Function;
            asyncAnalysis.pushToPendingCallbackFunctions(new CallbackFunction(callback, 'eventListener', currentCallbackFunction, register));
        }
        else if (f === EventEmitter.prototype.once)
        {
            const callback = args[1] as Function;
            asyncAnalysis.pushToPendingCallbackFunctions(new CallbackFunction(callback, 'eventListenerOnce', currentCallbackFunction, register));
        }
    };
};

export const functionEnterGenerator = (asyncAnalysis: AsyncAnalysis): Hooks['functionEnter'] =>
{
    const onBeforeCurrentCallbackFunctionChanges = () =>
    {
        const currentCallbackFunction = asyncAnalysis.getCurrentCallbackFunction();
        // may be called again, put the callback back to `pendingCallbackFunctions`
        if (currentCallbackFunction.type === 'interval' || currentCallbackFunction.type === 'eventListener')
        {
            const {
                func,
                type,
                asyncScope,
                registerCodeInfo,
            } = currentCallbackFunction;
            // Do not put reference back again. We need a new object to distinguish different calls
            asyncAnalysis.pushToPendingCallbackFunctions(new CallbackFunction(func, type, asyncScope, registerCodeInfo));
        }
    };

    return (iid, f, dis, args) =>
    {
        const pendingCallbackFunctionsClone = asyncAnalysis.getPendingCallbackFunctionsClone();
        for (let i = pendingCallbackFunctionsClone.length - 1; i >= 0; i--)
        {
            const pendingCallbackFunction = pendingCallbackFunctionsClone[i]!;
            // actually its not precise here
            if (pendingCallbackFunction.func === f)    // switch to the next pending callback
            {
                onBeforeCurrentCallbackFunctionChanges();
                asyncAnalysis.setCurrentCallbackFunction(pendingCallbackFunction);
                asyncAnalysis.removeFromPendingCallbackFunctions(i);
                break;
            }
        }
    };
};