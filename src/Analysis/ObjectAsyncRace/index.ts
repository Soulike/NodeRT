// DO NOT INSTRUMENT

import Sandbox from '../../Type/Sandbox';
import ObjectAsyncRace from './ObjectAsyncRace';

declare const J$: Sandbox;

(function (sandbox: Sandbox)
{
    sandbox.analysis = new ObjectAsyncRace(sandbox);
})(J$);