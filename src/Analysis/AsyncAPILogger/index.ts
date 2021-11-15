import {Analysis, Sandbox} from '../../Type/nodeprof';
import {TimeoutLogger} from './TimeoutLogger';
import {ImmediateLogger} from './ImmediateLogger';

export class AsyncAPILogger extends Analysis
{
    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        sandbox.addAnalysis(new TimeoutLogger(sandbox));
        sandbox.addAnalysis(new ImmediateLogger(sandbox));
    }

    protected override registerHooks()
    {
        // void
    }
}