// DO NOT INSTRUMENT

import Hooks from '../../Type/Hooks';
import Sandbox from '../../Type/Sandbox';
import Analysis from '../../Type/Analysis';
import async_hooks from 'async_hooks';
import CallbackFunction from '../Class/CallbackFunction';
import {strict as assert} from 'assert';
import {getSourceCodeInfoFromIid} from '../Util';
import CallbackFunctionContext from '../Singleton/CallbackFunctionContext';

/**
 * Logging all callback function content information into `CallbackFunctionContext`.
 * Should be run prior to other analysis. i.e. `--analysis AsyncContext --analysis otherAnalysis`
 * */
class AsyncContext extends Analysis
{
    public functionEnter: Hooks['functionEnter'] | undefined;

    private asyncContextChanged: boolean;
    private lastAsyncId: number;
    private asyncIdToFunctionCall: Map<number, CallbackFunction>;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.asyncContextChanged = false;
        this.lastAsyncId = -1;
        this.asyncIdToFunctionCall = new Map([[1, CallbackFunction.GLOBAL]]);

        async_hooks.createHook({
            init(asyncId: number, type: string, triggerAsyncId: number, resource: object) {},
            before: this.asyncHookBefore,
        }).enable();

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.functionEnter = (iid, f, dis, args) =>
        {
            if (this.asyncContextChanged)
            {
                const asyncId = async_hooks.executionAsyncId();
                const triggerAsyncId = async_hooks.triggerAsyncId();

                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);

                assert.ok(triggerAsyncId !== 0);    // TODO: 解决 await 问题
                assert.ok(this.lastAsyncId === asyncId);

                let triggerAsyncFunction = this.asyncIdToFunctionCall.get(triggerAsyncId);
                // for Promises
                triggerAsyncFunction = triggerAsyncFunction === undefined ? CallbackFunction.GLOBAL : triggerAsyncFunction;


                const functionCall = new CallbackFunction(f, asyncId, triggerAsyncFunction, sourceCodeInfo);
                this.asyncIdToFunctionCall.set(asyncId, functionCall);
                CallbackFunctionContext.setCurrentCallbackFunction(functionCall);

                this.asyncContextChanged = false;
                this.lastAsyncId = -1;
            }
        };
    }

    // must be an arrow function to fix `this`
    private asyncHookBefore = (asyncId: number) =>
    {
        if (asyncId !== 0)
        {
            this.asyncContextChanged = true;
            this.lastAsyncId = asyncId;
        }
    };
}

export default AsyncContext;