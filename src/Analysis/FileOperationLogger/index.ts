// DO NOT INSTRUMENT

import Sandbox from '../../Type/Sandbox';
import FileOperationLogger from './FileOperationLogger';

declare const J$: Sandbox;

(function (sandbox: Sandbox)
{
    sandbox.analysis = new FileOperationLogger(sandbox);
})(J$);