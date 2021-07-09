// DO NOT INSTRUMENT

import {Sandbox} from '../../Type/nodeprof';
import ReferenceMetaOperationLogger from './ReferenceMetaOperationLogger';

(function (sandbox: Sandbox)
{
    sandbox.analysis = new ReferenceMetaOperationLogger(sandbox);
})(J$);