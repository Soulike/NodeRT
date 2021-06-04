// DO NOT INSTRUMENT

import Hooks from '../../Type/Hooks';
import Sandbox from '../../Type/Sandbox';
import CallbackFunction from '../Class/CallbackFunction';
import CallbackFunctionContext from '../Singleton/CallbackFunctionContext';
import SourceCodeInfo from '../Class/SourceCodeInfo';
import Range from '../Class/Range';
import EventEmitter from 'events';
import Analysis from '../../Type/Analysis';
import LastExpressionValueContainer from '../Singleton/LastExpressionValueContainer';
import {getSourceCodeInfoFromIid} from '../Util';
import {strict as assert} from 'assert';

/**
 * Logging all callback function content information into `CallbackFunctionContext`.
 * Should be run prior to other analysis. i.e. `--analysis AsyncContext --analysis otherAnalysis`
 * */
class AsyncContext extends Analysis
{
    public functionEnter: Hooks['functionEnter'] | undefined;
    private static readonly AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    public invokeFunPre: Hooks['invokeFunPre'] | undefined;
    public endExpression: Hooks['endExpression'] | undefined;
    public asyncFunctionExit: Hooks['asyncFunctionExit'] | undefined;
    public awaitPre: Hooks['awaitPre'] | undefined;
    private readonly asyncFunctionCallStack: Function[];

    private currentPromiseThenChain: CallbackFunction[];
    private currentPromiseRejectChain: CallbackFunction[];

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.asyncFunctionCallStack = [];

        this.currentPromiseThenChain = [];
        this.currentPromiseRejectChain = [];
        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.functionEnter = (iid, f, dis, args) =>
        {
            if (f instanceof AsyncContext.AsyncFunction) // is a async function, log it
            {
                this.asyncFunctionCallStack.push(f);
            }
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

        this.asyncFunctionExit = (iid, returnVal, wrappedExceptionVal) =>
        {
            this.asyncFunctionCallStack.pop();
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

            if (f === Promise.prototype.then)
            {
                const resolve = args[0];
                const reject = args[1];
                if (typeof resolve === 'function')
                {
                    const lastPromiseThen = this.currentPromiseThenChain.length === 0 ?
                        currentCallbackFunction :
                        this.currentPromiseThenChain[this.currentPromiseThenChain.length - 1]!;
                    const newPromiseThen = new CallbackFunction(resolve, 'promiseThen', lastPromiseThen, register);
                    CallbackFunctionContext.pushToPendingCallbackFunctions(newPromiseThen);
                    this.currentPromiseThenChain.push(newPromiseThen);
                }
                if (typeof reject === 'function')
                {
                    const lastPromiseReject = this.currentPromiseRejectChain.length === 0 ?
                        currentCallbackFunction :
                        this.currentPromiseRejectChain[this.currentPromiseRejectChain.length - 1]!;
                    const newPromiseReject = new CallbackFunction(reject, 'promiseThen', lastPromiseReject, register);
                    CallbackFunctionContext.pushToPendingCallbackFunctions(newPromiseReject);
                    this.currentPromiseThenChain.push(newPromiseReject);
                }
            }
            else if (f === Promise.prototype.catch)
            {
                const callback = args[1];
                if (typeof callback === 'function')
                {
                    const lastPromiseReject = this.currentPromiseRejectChain.length === 0 ?
                        currentCallbackFunction :
                        this.currentPromiseRejectChain[this.currentPromiseRejectChain.length - 1]!;
                    const newPromiseReject = new CallbackFunction(callback, 'promiseThen', lastPromiseReject, register);
                    CallbackFunctionContext.pushToPendingCallbackFunctions(newPromiseReject);
                    this.currentPromiseThenChain.push(newPromiseReject);
                }
            }
            else if (f === Promise.prototype.finally)
            {
                const callback = args[1];
                if (typeof callback === 'function')
                {
                    const lastPromiseThen = this.currentPromiseThenChain.length === 0 ?
                        currentCallbackFunction :
                        this.currentPromiseThenChain[this.currentPromiseThenChain.length - 1]!;
                    const newPromiseThen = new CallbackFunction(callback, 'promiseThen', lastPromiseThen, register);
                    CallbackFunctionContext.pushToPendingCallbackFunctions(newPromiseThen);
                    this.currentPromiseThenChain.push(newPromiseThen);
                }
            }
            else
            {
                this.currentPromiseThenChain = [];
                this.currentPromiseRejectChain = [];

                if (f === setTimeout)
                {
                    const callback = args[0] as Function;
                    assert.ok(typeof callback === 'function');
                    CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(callback, 'timeout', currentCallbackFunction, register));
                }
                else if (f === setImmediate)
                {
                    const callback = args[0] as Function;
                    assert.ok(typeof callback === 'function');
                    CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(callback, 'immediate', currentCallbackFunction, register));
                }
                else if (f === setInterval)
                {
                    const callback = args[0] as Function;
                    assert.ok(typeof callback === 'function');
                    CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(callback, 'interval', currentCallbackFunction, register));
                }
                else if (f === process.nextTick)
                {
                    const callback = args[0] as Function;
                    assert.ok(typeof callback === 'function');
                    CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(callback, 'nextTick', currentCallbackFunction, register));
                }
                else if (f === EventEmitter.prototype.on)
                {
                    const callback = args[1] as Function;
                    assert.ok(typeof callback === 'function');
                    CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(callback, 'eventListener', currentCallbackFunction, register));
                }
                else if (f === EventEmitter.prototype.once)
                {
                    const callback = args[1] as Function;
                    assert.ok(typeof callback === 'function');
                    CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(callback, 'eventListenerOnce', currentCallbackFunction, register));
                }
            }
        };

        this.endExpression = (iid, type, value) =>
        {
            LastExpressionValueContainer.setLastExpressionValue(value);
        };

        this.awaitPre = (iid, promiseOrValAwaited) =>
        {
            assert.ok(this.asyncFunctionCallStack.length > 0);

            const sandbox = this.getSandbox();
            const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
            const register = getSourceCodeInfoFromIid(iid, sandbox);
            const currentAsyncFunction = this.asyncFunctionCallStack[this.asyncFunctionCallStack.length - 1]!;    // ensured by assert
            // when encountering `await`, the current function will be paused, and will be called later
            CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(currentAsyncFunction, 'awaitContinue', currentCallbackFunction, register));
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