// DO NOT INSTRUMENT

import {Sandbox} from '../../Type/nodeprof';
import ObjectFieldOperationLogger from './ObjectFieldOperationLogger';

(function (sandbox: Sandbox)
{
    sandbox.analysis = new ObjectFieldOperationLogger(sandbox);
})(J$);