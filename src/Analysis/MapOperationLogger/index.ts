// DO NOT INSTRUMENT

import {Sandbox} from '../../Type/nodeprof';
import {MapOperationLogger} from './MapOperationLogger';

(function (sandbox: Sandbox)
{
    sandbox.analysis = new MapOperationLogger(sandbox);
})(J$);