// DO NOT INSTRUMENT

import {Analysis, Sandbox} from '../../Type/nodeprof';
import {FileHandleOperationLogger} from './SubLogger/FileHandleOperationLogger';
import {FsAsyncOperationLogger} from './SubLogger/FsAsyncOperationLogger';
import {FsDirOperationLogger} from './SubLogger/FsDirOperationLogger';
import {FsPromisesOperationLogger} from './SubLogger/FsPromisesOperationLogger';
import {FsSyncOperationLogger} from './SubLogger/FsSyncOperationLogger';

export class FsOperationLogger extends Analysis
{
    constructor(sandbox: Sandbox)
    {
        super(sandbox);
    }

    protected override registerHooks()
    {
        const sandbox = this.getSandbox();
        sandbox.addAnalysis(new FileHandleOperationLogger(sandbox));
        sandbox.addAnalysis(new FsAsyncOperationLogger(sandbox));
        sandbox.addAnalysis(new FsSyncOperationLogger(sandbox));
        sandbox.addAnalysis(new FsDirOperationLogger(sandbox));
        sandbox.addAnalysis(new FsPromisesOperationLogger(sandbox));
    }
}