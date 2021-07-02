// DO NOT INSTRUMENT

import Sandbox from '../../Type/Sandbox';
import ObjectFieldOperationLogger from './ObjectFieldOperationLogger';

declare const J$: Sandbox;

(function (sandbox: Sandbox)
{
    sandbox.analysis = new ObjectFieldOperationLogger(sandbox);
})(J$);