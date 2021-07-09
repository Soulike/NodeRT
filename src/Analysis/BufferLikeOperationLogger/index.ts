// DO NOT INSTRUMENT

import Sandbox from '../../Type/Sandbox';
import BufferOperationLogger from './BufferOperationLogger';
import TypedArrayOperationLogger from './TypedArrayOperationLogger';
import DataViewOperationLogger from './DataViewOperationLogger';
import ArrayBufferOperationLogger from './ArrayBufferOperationLogger';

declare const J$: Sandbox;

(function (sandbox: Sandbox)
{
    sandbox.addAnalysis(new BufferOperationLogger(sandbox));
    sandbox.addAnalysis(new TypedArrayOperationLogger(sandbox));
    sandbox.addAnalysis(new DataViewOperationLogger(sandbox));
    sandbox.addAnalysis(new ArrayBufferOperationLogger(sandbox));
})(J$);