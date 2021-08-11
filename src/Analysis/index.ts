// DO NOT INSTRUMENT

import {Sandbox} from '../Type/nodeprof';
import {AsyncContextLogger} from './AsyncContextLogger';
import {LastExpressionValueLogger} from './LastExpressionValueLogger';
import {PrimitiveOperationLogger} from './PrimitiveOperationLogger';
import {ObjectOperationLogger} from './ObjectOperationLogger';
import {BufferLikeOperationLogger} from './BufferLikeOperationLogger';
import {ArrayOperationLogger} from './ArrayOperationLogger';
import {FileOperationLogger} from './FileOperationLogger';
import {MapOperationLogger} from './MapOperationLogger';
import {SetOperationLogger} from './SetOperationLogger';
import {PrimitiveLogStoreAnalysis} from './LogStoreAnalysis/PrimitiveLogStoreAnalysis';
import {ObjectLogStoreAnalysis} from './LogStoreAnalysis/ObjectLogStoreAnalysis';
import {BufferLogStoreAnalysis} from './LogStoreAnalysis/BufferLogStoreAnalysis';
import {FileLogStoreAnalysis} from './LogStoreAnalysis/FileLogStoreAnalysis';

(function (sandbox: Sandbox)
{
    if (false)
    {
        sandbox.addAnalysis(new ArrayOperationLogger(sandbox));

        sandbox.addAnalysis(new SetOperationLogger(sandbox));
        sandbox.addAnalysis(new MapOperationLogger(sandbox));

        sandbox.addAnalysis(new FileOperationLogger(sandbox));
        sandbox.addAnalysis(new FileLogStoreAnalysis(sandbox));

        sandbox.addAnalysis(new BufferLikeOperationLogger(sandbox));
        sandbox.addAnalysis(new BufferLogStoreAnalysis(sandbox));

        sandbox.addAnalysis(new PrimitiveOperationLogger(sandbox));
        sandbox.addAnalysis(new PrimitiveLogStoreAnalysis(sandbox));

        sandbox.addAnalysis(new ObjectOperationLogger(sandbox));
        sandbox.addAnalysis(new ObjectLogStoreAnalysis(sandbox));

        sandbox.addAnalysis(new AsyncContextLogger(sandbox));
        sandbox.addAnalysis(new LastExpressionValueLogger(sandbox));
    }
    else
    {

    }
})(J$);