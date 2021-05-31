// DO NOT INSTRUMENT

import Sandbox from '../../Type/Sandbox';
import MapAsyncRace from './MapAsyncRace';

declare const J$: Sandbox;

(function (sandbox: Sandbox)
{
    sandbox.analysis = new MapAsyncRace(sandbox);
})(J$);