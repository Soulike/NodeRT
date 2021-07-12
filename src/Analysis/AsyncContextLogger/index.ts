// DO NOT INSTRUMENT

import {Sandbox} from '../../Type/nodeprof';
import {AsyncContextLogger} from './AsyncContextLogger';

(function (sandbox: Sandbox)
{
    sandbox.analysis = new AsyncContextLogger(sandbox);
})(J$);

export {AsyncContextLogger};