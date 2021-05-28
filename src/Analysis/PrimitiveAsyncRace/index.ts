// DO NOT INSTRUMENT
import Sandbox from '../../Type/Sandbox';
import PrimitiveAsyncRaceAnalysis from './PrimitiveAsyncRaceAnalysis';

declare const J$: Sandbox;

(function (sandbox: Sandbox)
{
    sandbox.analysis = new PrimitiveAsyncRaceAnalysis(sandbox);
})(J$);
