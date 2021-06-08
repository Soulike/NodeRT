// DO NOT INSTRUMENT

import Sandbox from '../../Type/Sandbox';
import ScopeAnalysis from './ScopeAnalysis';

declare const J$: Sandbox;

(function (sandbox: Sandbox)
{
    sandbox.analysis = new ScopeAnalysis(sandbox);
})(J$);