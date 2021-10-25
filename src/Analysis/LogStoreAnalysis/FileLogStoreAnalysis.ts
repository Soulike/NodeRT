// DO NOT INSTRUMENT

import {FileLogStore} from '../../LogStore/FileLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {outputSync, toJSON} from '../../Util';

export class FileLogStoreAnalysis extends Analysis
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
            outputSync(toJSON(FileLogStore.getFileDeclarations()),'fileLogStore.json');
        };
    }
}