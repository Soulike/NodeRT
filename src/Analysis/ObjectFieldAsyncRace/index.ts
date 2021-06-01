// DO NOT INSTRUMENT

import Sandbox from '../../Type/Sandbox';
import ObjectFieldAsyncRace from './ObjectFieldAsyncRace';

declare const J$: Sandbox;

(function (sandbox: Sandbox)
{
    sandbox.analysis = new ObjectFieldAsyncRace(sandbox);
})(J$);