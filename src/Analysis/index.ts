// DO NOT INSTRUMENT

import {Sandbox} from '../Type/nodeprof';
import {AsyncContextLogger} from './AsyncContextLogger';
import {LastExpressionValueLogger} from './LastExpressionValueLogger';
import {PrimitiveOperationLogger} from './PrimitiveOperationLogger';
import {PrimitiveLogStoreAnalysis} from './LogStoreAnalysis/PrimitiveLogStoreAnalysis';

(function (sandbox: Sandbox)
{
    sandbox.addAnalysis(new AsyncContextLogger(sandbox));
    sandbox.addAnalysis(new LastExpressionValueLogger(sandbox));
    sandbox.addAnalysis(new PrimitiveOperationLogger(sandbox));
    sandbox.addAnalysis(new PrimitiveLogStoreAnalysis(sandbox));    // for debug
})(J$);