// DO NOT INSTRUMENT

import Sandbox from '../../Type/Sandbox';
import ScopeTest from './ScopeTest';

declare const J$: Sandbox;

(function (sandbox: Sandbox)
{
    sandbox.analysis = new ScopeTest(sandbox);
})(J$);