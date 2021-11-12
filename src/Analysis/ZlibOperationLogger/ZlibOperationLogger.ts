// DO NOT INSTRUMENT

import zlib from 'zlib';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {StreamLogStore} from '../../LogStore/StreamLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike, shouldBeVerbose} from '../../Util';

export class ZlibOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public functionEnter: Hooks['functionEnter'] | undefined;
    public endExecution: Hooks['endExecution'] | undefined;

    private timeConsumed: number;

    private readonly pendingCallbacks: WeakSet<zlib.CompressCallback>;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.timeConsumed = 0;
        this.pendingCallbacks = new WeakSet();
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, _base, args, result) =>
        {
            const startTimestamp = Date.now();

            if (f === zlib.createBrotliCompress
                || f === zlib.createBrotliDecompress
                || f === zlib.createDeflate
                || f === zlib.createDeflateRaw
                || f === zlib.createGunzip
                || f === zlib.createGzip
                || f === zlib.createInflate
                || f === zlib.createInflateRaw
                || f === zlib.createUnzip)
            {
                const stream = result as ReturnType<typeof zlib.createBrotliCompress
                    | typeof zlib.createBrotliDecompress
                    | typeof zlib.createDeflate
                    | typeof zlib.createDeflateRaw
                    | typeof zlib.createGunzip
                    | typeof zlib.createInflate
                    | typeof zlib.createInflateRaw
                    | typeof zlib.createUnzip>;
                StreamLogStore.appendStreamOperation(stream, 'write', 'construction', this.getSandbox(), iid);
            }
            else if (f === zlib.brotliCompress
                || f === zlib.brotliDecompress
                || f === zlib.deflate
                || f === zlib.deflateRaw
                || f === zlib.gunzip
                || f === zlib.gzip
                || f === zlib.inflate
                || f === zlib.inflateRaw
                || f === zlib.unzip)
            {
                const buffer = args[0] as Parameters<typeof zlib.brotliCompress>[0];
                const callback = args[args.length - 1] as LastParameter<typeof zlib.brotliCompress>;
                if (isBufferLike(buffer))
                {
                    BufferLogStore.appendBufferOperation(buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(buffer),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                this.pendingCallbacks.add(callback);
            }
            else if (f === zlib.brotliCompressSync
                || f === zlib.brotliDecompressSync
                || f === zlib.deflateSync
                || f === zlib.deflateRawSync
                || f === zlib.gunzipSync
                || f === zlib.gzipSync
                || f === zlib.inflateSync
                || f === zlib.inflateRawSync
                || f === zlib.unzipSync)
            {
                const buffer = args[0] as Parameters<typeof zlib.brotliCompressSync>[0];
                const returned = result as ReturnType<typeof zlib.brotliCompressSync>;
                if (isBufferLike(buffer))
                {
                    BufferLogStore.appendBufferOperation(buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(buffer),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                BufferLogStore.appendBufferOperation(returned, 'write', 'finish',
                    BufferLogStore.getArrayBufferFieldsOfArrayBufferView(returned),
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.functionEnter = (iid, f, _dis, args) =>
        {
            const startTimestamp = Date.now();

            // @ts-ignore
            if (this.pendingCallbacks.has(f))
            {
                const [err, buffer] = args as Parameters<zlib.CompressCallback>;
                if (err !== null)
                {
                    BufferLogStore.appendBufferOperation(buffer, 'write', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(buffer),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`Zlib: ${this.timeConsumed / 1000}s`);
            }
        };
    }
}
