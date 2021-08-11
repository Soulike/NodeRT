// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {toJSON} from '../../Util';
import {FileLogStore} from '../../LogStore/FileLogStore';

export class FileLogStoreAnalysis extends Analysis
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
            console.log(toJSON(FileLogStore.getFileDeclarations()));
        };
    }
}