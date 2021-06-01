// DO NOT INSTRUMENT

import Sandbox from '../../Type/Sandbox';
import ArrayAsyncRace from './ArrayAsyncRace';

declare const J$: Sandbox;

(function (sandbox: Sandbox)
{
    sandbox.analysis = new ArrayAsyncRace(sandbox);
})(J$);