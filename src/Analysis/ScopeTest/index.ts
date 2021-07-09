// DO NOT INSTRUMENT

import {Sandbox} from '../../Type/nodeprof';
import ScopeTest from './ScopeTest';

(function (sandbox: Sandbox)
{
    sandbox.analysis = new ScopeTest(sandbox);
})(J$);