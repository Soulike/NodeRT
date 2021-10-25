// DO NOT INSTRUMENT

import {OutgoingMessageLogStore} from '../../LogStore/OutgoingMessageLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {outputSync, toJSON} from '../../Util';

export class OutgoingMessageStoreAnalysis extends Analysis
{
    public endExecution: Hooks['endExecution'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
    }

    protected registerHooks(): void
    {
        this.endExecution = () =>
        {
            outputSync(toJSON(OutgoingMessageLogStore.getOutgoingMessageDeclarations()), 'outgoingMessageLogStore.json');
        };
    }
}