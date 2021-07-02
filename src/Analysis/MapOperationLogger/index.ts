// DO NOT INSTRUMENT

import Sandbox from '../../Type/Sandbox';
import MapOperationLogger from './MapOperationLogger';

declare const J$: Sandbox;

(function (sandbox: Sandbox)
{
    sandbox.analysis = new MapOperationLogger(sandbox);
})(J$);