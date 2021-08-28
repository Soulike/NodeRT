// DO NOT INSTRUMENT

import {Sandbox} from '../Type/nodeprof';
import {ArrayOperationLogger} from './ArrayOperationLogger';
import {AsyncContextLogger} from './AsyncContextLogger';
import {BufferLikeOperationLogger} from './BufferLikeOperationLogger';
import {CryptoOperationLogger} from './CryptoOperationLogger';
import {DgramOperationLogger} from './DgramOperationLogger';
import {FsOperationLogger} from './FsOperationLogger';
import {HttpOperationLogger} from './HttpOperationLogger';
import {IteratorLogger} from './IteratorLogger';
import {LastExpressionValueLogger} from './LastExpressionValueLogger';
import {BufferLogStoreAnalysis} from './LogStoreAnalysis/BufferLogStoreAnalysis';
import {FileLogStoreAnalysis} from './LogStoreAnalysis/FileLogStoreAnalysis';
import {ObjectLogStoreAnalysis} from './LogStoreAnalysis/ObjectLogStoreAnalysis';
import {PrimitiveLogStoreAnalysis} from './LogStoreAnalysis/PrimitiveLogStoreAnalysis';
import {SocketLogStoreAnalysis} from './LogStoreAnalysis/SocketLogStoreAnalysis';
import {StreamLogStoreAnalysis} from './LogStoreAnalysis/StreamLogStoreAnalysis';
import {MapOperationLogger} from './MapOperationLogger';
import {NetOperationLogger} from './NetOperationLogger';
import {ObjectOperationLogger} from './ObjectOperationLogger';
import {PrimitiveOperationLogger} from './PrimitiveOperationLogger';
import {SetOperationLogger} from './SetOperationLogger';
import {StringDecoderOperationLogger} from './StreamDecoderOperationLogger';
import {StreamOperationLogger} from './StreamOperationLogger';
import {ZlibOperationLogger} from './ZlibOperationLogger';

(function (sandbox: Sandbox)
{
    if (false)
    {
        // basic
        sandbox.addAnalysis(new AsyncContextLogger(sandbox));
        sandbox.addAnalysis(new LastExpressionValueLogger(sandbox));
        sandbox.addAnalysis(new IteratorLogger(sandbox));

        // object
        sandbox.addAnalysis(new ArrayOperationLogger(sandbox));
        sandbox.addAnalysis(new SetOperationLogger(sandbox));
        sandbox.addAnalysis(new MapOperationLogger(sandbox));
        sandbox.addAnalysis(new ObjectOperationLogger(sandbox));

        sandbox.addAnalysis(new ObjectLogStoreAnalysis(sandbox));

        // file
        sandbox.addAnalysis(new FsOperationLogger(sandbox));
        sandbox.addAnalysis(new FileLogStoreAnalysis(sandbox));

        // buffer
        sandbox.addAnalysis(new BufferLikeOperationLogger(sandbox));
        sandbox.addAnalysis(new BufferLogStoreAnalysis(sandbox));

        // primitive
        sandbox.addAnalysis(new PrimitiveOperationLogger(sandbox));
        sandbox.addAnalysis(new PrimitiveLogStoreAnalysis(sandbox));

        // socket
        sandbox.addAnalysis(new DgramOperationLogger(sandbox));
        sandbox.addAnalysis(new HttpOperationLogger(sandbox));
        sandbox.addAnalysis(new NetOperationLogger(sandbox));
        sandbox.addAnalysis(new SocketLogStoreAnalysis(sandbox));

        // stream
        sandbox.addAnalysis(new StreamOperationLogger(sandbox));
        sandbox.addAnalysis(new StreamLogStoreAnalysis(sandbox));

        // misc
        sandbox.addAnalysis(new CryptoOperationLogger(sandbox));
        sandbox.addAnalysis(new ZlibOperationLogger(sandbox));
        sandbox.addAnalysis(new StringDecoderOperationLogger(sandbox));
    }
    else
    {
        // basic
        sandbox.addAnalysis(new AsyncContextLogger(sandbox));
        sandbox.addAnalysis(new LastExpressionValueLogger(sandbox));
        sandbox.addAnalysis(new IteratorLogger(sandbox));

        // object
        sandbox.addAnalysis(new ArrayOperationLogger(sandbox));
        sandbox.addAnalysis(new SetOperationLogger(sandbox));
        sandbox.addAnalysis(new MapOperationLogger(sandbox));
        sandbox.addAnalysis(new ObjectOperationLogger(sandbox));

        // sandbox.addAnalysis(new ObjectLogStoreAnalysis(sandbox));

        // file
        sandbox.addAnalysis(new FsOperationLogger(sandbox));
        // sandbox.addAnalysis(new FileLogStoreAnalysis(sandbox));

        // buffer
        sandbox.addAnalysis(new BufferLikeOperationLogger(sandbox));
        // sandbox.addAnalysis(new BufferLogStoreAnalysis(sandbox));

        // primitive
        sandbox.addAnalysis(new PrimitiveOperationLogger(sandbox));
        // sandbox.addAnalysis(new PrimitiveLogStoreAnalysis(sandbox));

        // socket
        sandbox.addAnalysis(new DgramOperationLogger(sandbox));
        sandbox.addAnalysis(new HttpOperationLogger(sandbox));
        sandbox.addAnalysis(new NetOperationLogger(sandbox));
        // sandbox.addAnalysis(new SocketLogStoreAnalysis(sandbox));

        // stream
        sandbox.addAnalysis(new StreamOperationLogger(sandbox));
        // sandbox.addAnalysis(new StreamLogStoreAnalysis(sandbox));

        // misc
        sandbox.addAnalysis(new CryptoOperationLogger(sandbox));
        sandbox.addAnalysis(new ZlibOperationLogger(sandbox));
        sandbox.addAnalysis(new StringDecoderOperationLogger(sandbox));
    }
})(J$);