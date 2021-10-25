// DO NOT INSTRUMENT

import {PrimitiveLogStore} from '../../LogStore/PrimitiveLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {outputSync, toJSON} from '../../Util';

export class PrimitiveLogStoreAnalysis extends Analysis
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
            outputSync(toJSON(PrimitiveLogStore.getPrimitiveDeclarations()),'primitiveLogStore.json');
        };
    }
}