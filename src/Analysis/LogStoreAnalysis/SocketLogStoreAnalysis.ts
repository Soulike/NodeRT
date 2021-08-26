// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {toJSON} from '../../Util';
import {SocketLogStore} from '../../LogStore/SocketLogStore';

export class SocketLogStoreAnalysis extends Analysis
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
            console.log(toJSON(SocketLogStore.getSocketDeclarations()));
        };
    }
}