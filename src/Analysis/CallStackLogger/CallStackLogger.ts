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

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.functionEnter = iid =>
        {
            CallStackLogStore.push(iid);
        }

        this.functionExit = iid =>
        {
            const topIid = CallStackLogStore.getTop();
            assert.equal(iid, topIid);
            CallStackLogStore.pop();
        }
    }
}