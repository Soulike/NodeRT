// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {outputSync, toJSON} from '../../Util';
import {OutgoingMessageLogStore} from '../../LogStore/OutgoingMessageLogStore';

export class OutgoingMessageStoreAnalysis extends Analysis
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
            outputSync(toJSON(OutgoingMessageLogStore.getOutgoingMessageDeclarations()), 'outgoingMessageLogStore.json');
        };
    }
}