// DO NOT INSTRUMENT
import Sandbox from '../../Type/Sandbox';
import ReferenceAsyncRace from './ReferenceAsyncRace';

declare const J$: Sandbox;

(function (sandbox: Sandbox)
{
    sandbox.analysis = new ReferenceAsyncRace(sandbox);
})(J$);