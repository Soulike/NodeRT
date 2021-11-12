// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import async_hooks from 'async_hooks';
import {AsyncContextLogStore} from '../../LogStore/AsyncContextLogStore';
import {AsyncCalledFunctionInfo} from '../../LogStore/Class/AsyncCalledFunctionInfo';
import {StatisticsStore} from '../../LogStore/StatisticsStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, shouldBeVerbose} from '../../Util';
import {CallStackLogStore} from '../../LogStore/CallStackLogStore';

/**
 * Logging all callback function content information into `AsyncContextLogStore`.
 * Should be run prior to other analysis. i.e. `--analysis AsyncContextLogStore --analysis otherAnalysis`
 * */
export class AsyncContextLogger extends Analysis
{
    public functionEnter: Hooks['functionEnter'] | undefined;
    public endExecution: Hooks['endExecution'] | undefined;

    private asyncContextChanged: boolean;
    private lastAsyncId: number;
    private lastTriggerAsyncId: number;

    private timeConsumed: number;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.asyncContextChanged = false;
        this.lastAsyncId = -1;
        this.lastTriggerAsyncId = -1;
        this.timeConsumed = 0;

        async_hooks.createHook({
            init: this.asyncHookInit,
            before: this.asyncHookBefore,
        }).enable();
    }

    protected override registerHooks()
    {
        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`AsyncContext: ${this.timeConsumed / 1000}s`);
            }
        };

        this.functionEnter = (iid, f) =>
        {
            const startTimestamp = Date.now();
            /*
            The function information logged here may not belong to the actual callback function, since the actual callback function could be located in a source file that is ignored
            
            What logged here is the information of the first called function located in file that is not ignored
            */
            if (this.asyncContextChanged)
            {
                StatisticsStore.addEventCount();
                const asyncId = this.lastAsyncId;
                const triggerAsyncId = this.lastTriggerAsyncId;

                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);

                let triggerAsyncFunction: AsyncCalledFunctionInfo | null | undefined = AsyncContextLogStore.getAsyncContextFromAsyncId(triggerAsyncId);
                assert.ok(triggerAsyncFunction !== undefined);

                const placeholderAsyncFunction: AsyncCalledFunctionInfo | null | undefined = AsyncContextLogStore.getAsyncContextFromAsyncId(asyncId);
                assert.ok(placeholderAsyncFunction !== undefined);

                // deal with setInterval, which will repeatedly use the same async id and function, need to create a new asyncContext
                if (placeholderAsyncFunction.functionWeakRef?.deref() === f)
                {   
                    AsyncContextLogStore.setAsyncIdToAsyncContext(asyncId, placeholderAsyncFunction.clone());
                }
                else
                {
                    // because asyncHookInit may be called before functionEnter, we must modify placeholderAsyncFunction directly
                    placeholderAsyncFunction.setInfo(f, CallStackLogStore.getCallStack(), asyncId, placeholderAsyncFunction.asyncType, triggerAsyncFunction, sourceCodeInfo);
                }

                this.asyncContextChanged = false;
                this.lastAsyncId = -1;
                this.lastTriggerAsyncId = -1;
            }

            this.timeConsumed += (Date.now() - startTimestamp);
        };
    }

    // must be an arrow function to fix `this`
    private asyncHookInit = (asyncId: number, type: string, triggerAsyncId: number) =>
    {
        const startTimestamp = Date.now();

        let triggerAsyncFunction = AsyncContextLogStore.getAsyncContextFromAsyncId(triggerAsyncId);
        if (triggerAsyncFunction === undefined)
        {
            console.warn(`undefined triggerAsyncFunction with triggerAsyncId ${triggerAsyncId}`);
            triggerAsyncFunction = AsyncCalledFunctionInfo.UNKNOWN;
        }
        if (asyncId !== AsyncCalledFunctionInfo.UNKNOWN_ASYNC_ID && asyncId !== AsyncCalledFunctionInfo.GLOBAL_ASYNC_ID)
        {
            const placeholderAsyncFunction = new AsyncCalledFunctionInfo(null, null, asyncId, type, triggerAsyncFunction, null);
            AsyncContextLogStore.setAsyncIdToAsyncContext(asyncId, placeholderAsyncFunction); // should be overwritten by functionEnter() if there is a function call
        }

        this.timeConsumed += (Date.now() - startTimestamp);
    };

    // must be an arrow function to fix `this`
    private asyncHookBefore = (asyncId: number) =>
    {
        const startTimestamp = Date.now();

        this.asyncContextChanged = true;
        assert.ok(asyncId === async_hooks.executionAsyncId());
        this.lastAsyncId = asyncId;
        this.lastTriggerAsyncId = async_hooks.triggerAsyncId(); // TODO: async 下有可能是 0？是 GraalVM 的 BUG？

        this.timeConsumed += (Date.now() - startTimestamp);
    };
}