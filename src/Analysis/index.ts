// DO NOT INSTRUMENT
import Sandbox from '../Type/Sandbox';
import AsyncApiAnalysis from './AsyncApi/AsyncApiAnalysis';

declare const J$: Sandbox;

(function (sandbox: Sandbox)
{
    sandbox.analysis = new AsyncApiAnalysis(sandbox);
})(J$);
