// DO NOT INSTRUMENT

import Sandbox from '../../Type/Sandbox';
import ReferenceMetaOperationLogger from './ReferenceMetaOperationLogger';

declare const J$: Sandbox;

(function (sandbox: Sandbox)
{
    sandbox.analysis = new ReferenceMetaOperationLogger(sandbox);
})(J$);