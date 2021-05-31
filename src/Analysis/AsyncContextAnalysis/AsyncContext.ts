// DO NOT INSTRUMENT
import Hooks from '../../Type/Hooks';
import Sandbox from '../../Type/Sandbox';
import CallbackFunction from '../Class/CallbackFunction';
import CallbackFunctionContext from '../Singleton/CallbackFunctionContext';
import SourceCodeInfo from '../Class/SourceCodeInfo';
import Range from '../Class/Range';
import EventEmitter from 'events';
import Analysis from '../../Type/Analysis';

/**
 * Logging all callback function content information into `CallbackFunctionContext`.
 * Should be run prior to other analysis. i.e. `--analysis AsyncContext --analysis otherAnalysis`
 * */
class AsyncContext extends Analysis
{
    public functionEnter: Hooks['functionEnter'] | undefined;
    public invokeFunPre: Hooks['invokeFunPre'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.functionEnter = (iid, f, dis, args) =>
        {
            const pendingCallbackFunctionsClone = CallbackFunctionContext.getPendingCallbackFunctionsClone();
            for (let i = pendingCallbackFunctionsClone.length - 1; i >= 0; i--)
            {
                const pendingCallbackFunction = pendingCallbackFunctionsClone[i]!;
                // actually its not precise here
                if (pendingCallbackFunction.func === f)    // switch to the next pending callback
                {
                    this.onBeforeCurrentCallbackFunctionChanges();
                    CallbackFunctionContext.setCurrentCallbackFunction(pendingCallbackFunction);
                    CallbackFunctionContext.removeFromPendingCallbackFunctions(i);
                    break;
                }
            }
        };

        this.invokeFunPre = (iid, f, base, args, isConstructor, isMethod, functionIid) =>
        {
            const sandbox = this.getSandbox();
            const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
            const {
                name,
                range,
            } = sandbox.iidToSourceObject(iid);
            const register = new SourceCodeInfo(name, new Range(range[0], range[1]));
            if (f === setTimeout)
            {
                const callback = args[0] as Function;
                CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(callback, 'timeout', currentCallbackFunction, register));
            }
            else if (f === setImmediate)
            {
                const callback = args[0] as Function;
                CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(callback, 'immediate', currentCallbackFunction, register));
            }
            else if (f === setInterval)
            {
                const callback = args[0] as Function;
                CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(callback, 'interval', currentCallbackFunction, register));
            }
            else if (f === process.nextTick)
            {
                const callback = args[0] as Function;
                CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(callback, 'nextTick', currentCallbackFunction, register));
            }
            else if (f === Promise.prototype.then)
            {
                const resolve = args[0];
                const reject = args[1];
                if (typeof resolve === 'function')
                {
                    CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(resolve, 'promiseThen', currentCallbackFunction, register));
                }
                if (typeof reject === 'function')
                {
                    CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(reject, 'promiseThen', currentCallbackFunction, register));
                }
            }
            else if (f === Promise.prototype.catch || f === Promise.prototype.finally)
            {
                const callback = args[1];
                if (typeof callback === 'function')
                {
                    CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(callback, 'promiseThen', currentCallbackFunction, register));
                }
            }
            else if (f === EventEmitter.prototype.on)
            {
                const callback = args[1] as Function;
                CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(callback, 'eventListener', currentCallbackFunction, register));
            }
            else if (f === EventEmitter.prototype.once)
            {
                const callback = args[1] as Function;
                CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(callback, 'eventListenerOnce', currentCallbackFunction, register));
            }
        };
    }

    private onBeforeCurrentCallbackFunctionChanges = () =>
    {
        const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
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
            CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(func, type, asyncScope, registerCodeInfo));
        }
    };
}

export default AsyncContext;