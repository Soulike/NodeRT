// DO NOT INSTRUMENT

import {Analysis, Sandbox} from '../../Type/nodeprof';
import {BufferOperationLogger} from './BufferOperationLogger';
import {TypedArrayOperationLogger} from './TypedArrayOperationLogger';
import {DataViewOperationLogger} from './DataViewOperationLogger';
import {ArrayBufferOperationLogger} from './ArrayBufferOperationLogger';

export class BufferLikeOperationLogger extends Analysis
{
    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        sandbox.addAnalysis(new ArrayBufferOperationLogger(sandbox));
        sandbox.addAnalysis(new BufferOperationLogger(sandbox));
        sandbox.addAnalysis(new DataViewOperationLogger(sandbox));
        sandbox.addAnalysis(new TypedArrayOperationLogger(sandbox));
    }

    protected override registerHooks()
    {
        // void
    }
}