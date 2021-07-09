// DO NOT INSTRUMENT

import {Sandbox} from '../../Type/nodeprof';
import ArrayOperationLogger from './ArrayOperationLogger';

(function (sandbox: Sandbox)
{
    sandbox.analysis = new ArrayOperationLogger(sandbox);
})(J$);