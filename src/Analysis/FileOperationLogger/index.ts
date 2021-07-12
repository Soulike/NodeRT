// DO NOT INSTRUMENT

import {Sandbox} from '../../Type/nodeprof';
import {FileOperationLogger} from './FileOperationLogger';

(function (sandbox: Sandbox)
{
    sandbox.analysis = new FileOperationLogger(sandbox);
})(J$);