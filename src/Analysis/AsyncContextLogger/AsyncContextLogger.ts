// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import async_hooks from 'async_hooks';
import {CallbackFunction} from '../../LogStore/Class/CallbackFunction';
import {strict as assert} from 'assert';
import {getSourceCodeInfoFromIid} from '../../Util';
import {AsyncContextLogStore} from '../../LogStore/AsyncContextLogStore';

/**
 * Logging all callback function content information into `AsyncContextLogStore`.
 * Should be run prior to other analysis. i.e. `--analysis AsyncContextLogStore --analysis otherAnalysis`
 * */
export class AsyncContextLogger extends Analysis
{
    public functionEnter: Hooks['functionEnter'] | undefined;

    private asyncContextChanged: boolean;
    private lastAsyncId: number;
    private lastTriggerAsyncId: number;
    private asyncIdToFunctionCall: Map<number, CallbackFunction>;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.asyncContextChanged = false;
        this.lastAsyncId = -1;
        this.lastTriggerAsyncId = -1;
        this.asyncIdToFunctionCall = new Map([
            [CallbackFunction.UNKNOWN_ASYNC_ID, CallbackFunction.UNKNOWN],
            [CallbackFunction.GLOBAL_ASYNC_ID, CallbackFunction.GLOBAL],
        ]);

        async_hooks.createHook({
            init: this.asyncHookInit,
            before: this.asyncHookBefore,
        }).enable();

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.functionEnter = (iid, f) =>
        {
            if (this.asyncContextChanged)
            {
                const asyncId = this.lastAsyncId;
                const triggerAsyncId = this.lastTriggerAsyncId;

                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);

                let triggerAsyncFunction: CallbackFunction | null | undefined = this.asyncIdToFunctionCall.get(triggerAsyncId);
                assert.ok(triggerAsyncFunction !== undefined);

                // skip asyncIds without related function calls until global or unknown
                while (triggerAsyncFunction.functionWeakRef === null
                && triggerAsyncFunction.asyncId !== CallbackFunction.GLOBAL_ASYNC_ID
                && triggerAsyncFunction.asyncId !== CallbackFunction.UNKNOWN_ASYNC_ID)
                {
                    triggerAsyncFunction = triggerAsyncFunction.asyncScope;    // won't be null, ensured by triggerAsyncFunction.asyncId !== ...
                    assert.ok(triggerAsyncFunction !== undefined && triggerAsyncFunction !== null);
                }

                const placeholderAsyncFunction: CallbackFunction | null | undefined = this.asyncIdToFunctionCall.get(asyncId);
                assert.ok(placeholderAsyncFunction !== undefined);

                const asyncFunction = new CallbackFunction(f, asyncId, placeholderAsyncFunction.type, triggerAsyncFunction, sourceCodeInfo);
                this.asyncIdToFunctionCall.set(asyncId, asyncFunction);
                AsyncContextLogStore.setCurrentCallbackFunction(asyncFunction);

                this.asyncContextChanged = false;
                this.lastAsyncId = -1;
                this.lastTriggerAsyncId = -1;
            }
        };
    }

    // must be an arrow function to fix `this`
    private asyncHookInit = (asyncId: number, type: string, triggerAsyncId: number) =>
    {
        let triggerAsyncFunction = this.asyncIdToFunctionCall.get(triggerAsyncId);
        if (triggerAsyncFunction === undefined)
        {
            console.warn(`undefined triggerAsyncFunction with triggerAsyncId ${triggerAsyncId}`);
            triggerAsyncFunction = CallbackFunction.UNKNOWN;
        }
        if (asyncId !== CallbackFunction.UNKNOWN_ASYNC_ID && asyncId !== CallbackFunction.GLOBAL_ASYNC_ID)
        {
            const placeholderAsyncFunction = new CallbackFunction(null, asyncId, type, triggerAsyncFunction, null);
            this.asyncIdToFunctionCall.set(asyncId, placeholderAsyncFunction); // should be overwritten by functionEnter() if there is a function call
        }
    };

    // must be an arrow function to fix `this`
    private asyncHookBefore = (asyncId: number) =>
    {
        this.asyncContextChanged = true;
        assert.ok(asyncId === async_hooks.executionAsyncId());
        this.lastAsyncId = asyncId;
        this.lastTriggerAsyncId = async_hooks.triggerAsyncId(); // TODO: async 下有可能是 0？是 GraalVM 的 BUG？
    };
}