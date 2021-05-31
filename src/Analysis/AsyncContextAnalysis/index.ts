// DO NOT INSTRUMENT
import Sandbox from '../../Type/Sandbox';
import AsyncContext from './AsyncContext';

declare const J$: Sandbox;

(function (sandbox: Sandbox)
{
    sandbox.analysis = new AsyncContext(sandbox);
})(J$);