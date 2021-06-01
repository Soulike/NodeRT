// DO NOT INSTRUMENT

import Sandbox from '../../Type/Sandbox';
import ReferenceMetaAsyncRace from './ReferenceMetaAsyncRace';

declare const J$: Sandbox;

(function (sandbox: Sandbox)
{
    sandbox.analysis = new ReferenceMetaAsyncRace(sandbox);
})(J$);