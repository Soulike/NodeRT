// DO NOT INSTRUMENT

import Sandbox from '../../Type/Sandbox';
import BufferOperationLogger from './BufferOperationLogger';

declare const J$: Sandbox;

(function (sandbox: Sandbox)
{
    sandbox.analysis = new BufferOperationLogger(sandbox);
})(J$);