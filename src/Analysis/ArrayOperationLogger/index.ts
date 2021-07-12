// DO NOT INSTRUMENT

import {Sandbox} from '../../Type/nodeprof';
import {ArrayOperationLogger} from './ArrayOperationLogger';
import {ArrayLogStoreAnalysis} from '../../LogStore/ArrayLogStore';
import {AsyncContextLogger} from '../AsyncContextLogger';

(function (sandbox: Sandbox)
{
    sandbox.addAnalysis(new AsyncContextLogger(sandbox));
    sandbox.addAnalysis(new ArrayLogStoreAnalysis(sandbox));
    sandbox.addAnalysis(new ArrayOperationLogger(sandbox));
})(J$);

export * from './ArrayOperationLogger';