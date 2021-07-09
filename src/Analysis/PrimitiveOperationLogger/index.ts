// DO NOT INSTRUMENT

import {Sandbox} from '../../Type/nodeprof';
import PrimitiveOperationLogger from './PrimitiveOperationLogger';

(function (sandbox: Sandbox)
{
    sandbox.analysis = new PrimitiveOperationLogger(sandbox);
})(J$);
