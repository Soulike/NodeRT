import assert from 'assert';
import {CallStackLogStore} from '../../LogStore/CallStackLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';

export class CallStackLogger extends Analysis
{
    public functionEnter: Hooks['functionEnter'] | undefined;
    public functionExit: Hooks['functionExit'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
    }

    protected override registerHooks()
    {
        this.functionEnter = iid =>
        {
            CallStackLogStore.push(this.getSandbox(), iid);
        };

        this.functionExit = iid =>
        {
            const topIid = CallStackLogStore.getTopIid();
            assert.equal(iid, topIid);
            CallStackLogStore.pop();
        };
    }
}