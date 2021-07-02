// DO NOT INSTRUMENT

import Sandbox from '../../Type/Sandbox';
import SetOperationLogger from './SetOperationLogger';

declare const J$: Sandbox;

(function (sandbox: Sandbox)
{
    sandbox.analysis = new SetOperationLogger(sandbox);
})(J$);