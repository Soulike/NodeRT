// DO NOT INSTRUMENT

import Hooks from '../../Type/Hooks';
import Sandbox from '../../Type/Sandbox';
import CallbackFunction from '../Class/CallbackFunction';
import CallbackFunctionContext from '../Singleton/CallbackFunctionContext';
import Analysis from '../../Type/Analysis';
import LastExpressionValueContainer from '../Singleton/LastExpressionValueContainer';
import {getSourceCodeInfoFromIid} from '../Util';
import {strict as assert} from 'assert';
import ProcessModule from './Module/ProcessModule';
import TimerModule from './Module/TimerModule';
import EventsModule from './Module/EventsModule';
import PromiseModule from './Module/PromiseModule';
import ChildProcessModule from './Module/ChildProcessModule';
import ClusterModule from './Module/ClusterModule';
import CryptoModule from './Module/CryptoModule';

/**
 * Logging all callback function content information into `CallbackFunctionContext`.
 * Should be run prior to other analysis. i.e. `--analysis AsyncContext --analysis otherAnalysis`
 * */
class AsyncContext extends Analysis
{
    public functionEnter: Hooks['functionEnter'] | undefined;
    private static readonly AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    public invokeFunPre: Hooks['invokeFunPre'] | undefined;
    public invokeFun: Hooks['invokeFun'] | undefined;
    public endExpression: Hooks['endExpression'] | undefined;
    public asyncFunctionExit: Hooks['asyncFunctionExit'] | undefined;
    public awaitPre: Hooks['awaitPre'] | undefined;
    private readonly asyncFunctionCallStack: Function[];

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.asyncFunctionCallStack = [];
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
            const register = getSourceCodeInfoFromIid(iid, sandbox);

            ProcessModule.runHooks(f, args, currentCallbackFunction, register);
            TimerModule.runHooks(f, args, currentCallbackFunction, register);
            EventsModule.runHooks(f, args, currentCallbackFunction, register);
            ChildProcessModule.runHooks(f, args, currentCallbackFunction, register);
            ClusterModule.runHooks(f, args, currentCallbackFunction, register);
            CryptoModule.runHooks(f, args, currentCallbackFunction, register);
        };

        this.invokeFun = (iid, f, base, args, result, isConstructor, isMethod, functionIid, functionSid) =>
        {
            const sandbox = this.getSandbox();
            const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
            const register = getSourceCodeInfoFromIid(iid, sandbox);

            PromiseModule.runHooks(f, base, args, result, currentCallbackFunction, register);
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
            CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(currentAsyncFunction, 'awaitContinue', currentCallbackFunction, null, null, register));
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
                registerPromise,
                resultPromise,
            } = currentCallbackFunction;
            // Do not put reference back again. We need a new object to distinguish different calls
            CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(func, type, asyncScope, registerPromise, resultPromise, registerCodeInfo));
        }
    };
}

export default AsyncContext;