// DO NOT INSTRUMENT

import Sandbox from '../../Type/Sandbox';
import ArrayOperationLogger from './ArrayOperationLogger';

declare const J$: Sandbox;

(function (sandbox: Sandbox)
{
    sandbox.analysis = new ArrayOperationLogger(sandbox);
})(J$);