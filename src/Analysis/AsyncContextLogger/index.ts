// DO NOT INSTRUMENT

import Sandbox from '../../Type/Sandbox';
import AsyncContextLogger from './AsyncContextLogger';

declare const J$: Sandbox;

(function (sandbox: Sandbox)
{
    sandbox.analysis = new AsyncContextLogger(sandbox);
})(J$);