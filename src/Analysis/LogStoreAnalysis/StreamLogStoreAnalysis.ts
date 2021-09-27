// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {outputSync, toJSON} from '../../Util';
import {StreamLogStore} from '../../LogStore/StreamLogStore';

export class StreamLogStoreAnalysis extends Analysis
{
    public endExecution: Hooks['endExecution'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected registerHooks(): void
    {
        this.endExecution = () =>
        {
            outputSync(toJSON(StreamLogStore.getStreamDeclarations()),'streamLogStore.json');
        };
    }
}