// DO NOT INSTRUMENT

import {Sandbox} from '../../Type/nodeprof';
import SetOperationLogger from './SetOperationLogger';

(function (sandbox: Sandbox)
{
    sandbox.analysis = new SetOperationLogger(sandbox);
})(J$);