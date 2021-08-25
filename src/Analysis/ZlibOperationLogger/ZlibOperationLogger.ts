// DO NOT INSTRUMENT

import zlib from 'zlib';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike} from '../../Util';

export class ZlibOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public functionEnter: Hooks['functionEnter'] | undefined;

    private readonly pendingCallbacks: WeakSet<zlib.CompressCallback>;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.pendingCallbacks = new WeakSet();

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, _base, args, result) =>
        {
            if (f === zlib.brotliCompress
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
                    BufferLogStore.appendBufferOperation(buffer, 'read',
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
                    BufferLogStore.appendBufferOperation(buffer, 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                BufferLogStore.appendBufferOperation(returned, 'write',
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
        };

        this.functionEnter = (iid, f, _dis, args) =>
        {
            // @ts-ignore
            if (this.pendingCallbacks.has(f))
            {
                const [err, buffer] = args as Parameters<zlib.CompressCallback>;
                if (err !== null)
                {
                    BufferLogStore.appendBufferOperation(buffer, 'write',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
        };
    }
}
