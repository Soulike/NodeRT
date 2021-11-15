import {Analysis, Sandbox} from '../../Type/nodeprof';
import {TimeoutLogger} from './TimeoutLogger';

export class AsyncAPILogger extends Analysis
{
    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        sandbox.addAnalysis(new TimeoutLogger(sandbox));
    }

    protected override registerHooks()
    {
        // void
    }
}