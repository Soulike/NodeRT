// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {BufferLogStore} from './BufferLogStore';
import {toJSON} from '../../Analysis/Util';

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
            console.log(toJSON(BufferLogStore.getBufferDeclarations()));
        };
    }
}