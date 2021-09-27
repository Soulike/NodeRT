// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {outputSync, toJSON} from '../../Util';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';

export class ObjectLogStoreAnalysis extends Analysis
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
            outputSync(toJSON(ObjectLogStore.getObjectDeclarations()),'objectLogStore.json');
        };
    }
}