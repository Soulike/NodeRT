// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {outputSync, toJSON} from '../../Util';

export class BufferLogStoreAnalysis extends Analysis
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
            outputSync(toJSON(BufferLogStore.getBufferDeclarations()), 'bufferLogStore.json');
        };
    }
}