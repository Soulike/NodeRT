// DO NOT INSTRUMENT

import Sandbox from '../../Type/Sandbox';
import PrimitiveOperationLogger from './PrimitiveOperationLogger';

declare const J$: Sandbox;

(function (sandbox: Sandbox)
{
    sandbox.analysis = new PrimitiveOperationLogger(sandbox);
})(J$);
