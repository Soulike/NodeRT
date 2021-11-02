// DO NOT INSTRUMENT

import {Sandbox} from '../Type/nodeprof';
import {shouldBeVerbose} from '../Util';
import {ArrayOperationLogger} from './ArrayOperationLogger';
import {AsyncContextLogger} from './AsyncContextLogger';
import {BufferLikeOperationLogger} from './BufferLikeOperationLogger';
import {CryptoOperationLogger} from './CryptoOperationLogger';
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
import {StringDecoderOperationLogger} from './StringDecoderOperationLogger';
import {StreamOperationLogger} from './StreamOperationLogger';
import {ZlibOperationLogger} from './ZlibOperationLogger';
import {OutgoingMessageStoreAnalysis} from './LogStoreAnalysis/OutgoingMessageLogStoreAnalysis';
import {CallStackLogger} from './CallStackLogger';
import {EventEmitterOperationLogger} from './EventEmitterOperationLogger';
import {EventEmitterLogStoreAnalysis} from './LogStoreAnalysis/EventEmitterLogStoreAnalysis';
import {JSONOperationLogger} from './JSONOperationLogger';

(function (sandbox: Sandbox)
{
    const startTimestamp = Date.now();

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
        sandbox.addAnalysis(new HttpOperationLogger(sandbox));
        sandbox.addAnalysis(new NetOperationLogger(sandbox));
        sandbox.addAnalysis(new SocketLogStoreAnalysis(sandbox));
        sandbox.addAnalysis(new OutgoingMessageStoreAnalysis(sandbox));

        // stream
        sandbox.addAnalysis(new StreamOperationLogger(sandbox));
        sandbox.addAnalysis(new StreamLogStoreAnalysis(sandbox));

        // eventEmitter
        sandbox.addAnalysis(new EventEmitterOperationLogger(sandbox));
        sandbox.addAnalysis(new EventEmitterLogStoreAnalysis(sandbox));

        // misc
        sandbox.addAnalysis(new CryptoOperationLogger(sandbox));
        sandbox.addAnalysis(new ZlibOperationLogger(sandbox));
        sandbox.addAnalysis(new StringDecoderOperationLogger(sandbox));
        sandbox.addAnalysis(new JSONOperationLogger(sandbox));
    }
    else
    {
        // basic
        sandbox.addAnalysis(new AsyncContextLogger(sandbox));
        sandbox.addAnalysis(new LastExpressionValueLogger(sandbox));
        sandbox.addAnalysis(new IteratorLogger(sandbox));
        sandbox.addAnalysis(new CallStackLogger(sandbox));

        // object
        sandbox.addAnalysis(new ArrayOperationLogger(sandbox));
        sandbox.addAnalysis(new SetOperationLogger(sandbox));
        sandbox.addAnalysis(new MapOperationLogger(sandbox));
        sandbox.addAnalysis(new ObjectOperationLogger(sandbox));

        // sandbox.addAnalysis(new ObjectLogStoreAnalysis(sandbox));

        // file
        sandbox.addAnalysis(new FsOperationLogger(sandbox));

        //sandbox.addAnalysis(new FileLogStoreAnalysis(sandbox));

        // buffer
        sandbox.addAnalysis(new BufferLikeOperationLogger(sandbox));

        // sandbox.addAnalysis(new BufferLogStoreAnalysis(sandbox));

        // primitive
        sandbox.addAnalysis(new PrimitiveOperationLogger(sandbox));

        sandbox.addAnalysis(new PrimitiveLogStoreAnalysis(sandbox));

        // socket
        sandbox.addAnalysis(new HttpOperationLogger(sandbox));
        sandbox.addAnalysis(new NetOperationLogger(sandbox));

        // sandbox.addAnalysis(new SocketLogStoreAnalysis(sandbox));
        // sandbox.addAnalysis(new OutgoingMessageStoreAnalysis(sandbox));

        // stream
        sandbox.addAnalysis(new StreamOperationLogger(sandbox));

        // sandbox.addAnalysis(new StreamLogStoreAnalysis(sandbox));

        // eventEmitter
        sandbox.addAnalysis(new EventEmitterOperationLogger(sandbox));

        // sandbox.addAnalysis(new EventEmitterLogStoreAnalysis(sandbox));

        // misc
        sandbox.addAnalysis(new CryptoOperationLogger(sandbox));
        sandbox.addAnalysis(new ZlibOperationLogger(sandbox));
        sandbox.addAnalysis(new StringDecoderOperationLogger(sandbox));
        sandbox.addAnalysis(new JSONOperationLogger(sandbox));

        const endTimestamp = Date.now() - startTimestamp;

        process.on('exit', () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`analysis load: ${endTimestamp / 1000}s`);
            }
        });
    }
})(J$);