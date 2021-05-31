// DO NOT INSTRUMENT

import Sandbox from '../../Type/Sandbox';
import SetAsyncRace from './SetAsyncRace';

declare const J$: Sandbox;

(function (sandbox: Sandbox)
{
    sandbox.analysis = new SetAsyncRace(sandbox);
})(J$);