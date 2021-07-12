// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {ArrayLogStore} from './ArrayLogStore';
import {toJSON} from '../../Util';

export class ArrayLogStoreAnalysis extends Analysis
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
            console.log(toJSON(ArrayLogStore.getArrayDeclarations()));
        };
    }
}