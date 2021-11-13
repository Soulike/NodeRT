// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import {pipeline, Readable, Transform, Writable} from 'stream';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {CallStackLogStore} from '../../LogStore/CallStackLogStore';
import {StreamLogStore} from '../../LogStore/StreamLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike, shouldBeVerbose} from '../../Util';

export class StreamOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public endExecution: Hooks['endExecution'] | undefined;

    private timeConsumed: number;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.timeConsumed = 0;
    }

    protected override doMonkeyPatch()
    {
        const loggerThis = this;

        const originalWritableDestroy = Writable.prototype.destroy;
        Writable.prototype.destroy = function (...args)
        {
            const startTimestamp = Date.now();
            StreamLogStore.appendStreamOperation(this, 'write', 'destroy', loggerThis.getSandbox(), CallStackLogStore.getTopIid());
            loggerThis.timeConsumed += Date.now() - startTimestamp;
            return originalWritableDestroy.call(this, ...args);
        };

        const originalReadableDestroy = Readable.prototype.destroy;
        Readable.prototype.destroy = function (...args)
        {
            const startTimestamp = Date.now();
            StreamLogStore.appendStreamOperation(this, 'write', 'destroy', loggerThis.getSandbox(), CallStackLogStore.getTopIid());
            loggerThis.timeConsumed += Date.now() - startTimestamp;
            return originalReadableDestroy.call(this, ...args);
        };

        const originalTransformDestroy = Transform.prototype.destroy;
        Transform.prototype.destroy = function (...args)
        {
            const startTimestamp = Date.now();
            StreamLogStore.appendStreamOperation(this, 'write', 'destroy', loggerThis.getSandbox(), CallStackLogStore.getTopIid());
            loggerThis.timeConsumed += Date.now() - startTimestamp;
            return originalTransformDestroy.call(this, ...args);
        };

        const originalWritableWrite = Writable.prototype.write;
        Writable.prototype.write = function (...args)
        {
            const startTimestamp = Date.now();
            StreamLogStore.appendStreamOperation(this, 'read', 'write', loggerThis.getSandbox(), CallStackLogStore.getTopIid());
            const [chunk] = args as Parameters<typeof Writable.prototype.write>;
            if (isBufferLike(chunk))
            {
                BufferLogStore.appendBufferOperation(chunk, 'read', 'finish',
                    BufferLogStore.getArrayBufferRangeOfArrayBufferView(chunk),
                    getSourceCodeInfoFromIid(CallStackLogStore.getTopIid(), loggerThis.getSandbox()));
            }
            loggerThis.timeConsumed += Date.now() - startTimestamp;
            // @ts-ignore
            return originalWritableWrite.call(this, ...args);
        };

        const originalWritableEnd = Writable.prototype.end;
        Writable.prototype.end = function (...args: any[])
        {
            const startTimestamp = Date.now();
            StreamLogStore.appendStreamOperation(this, 'write', 'end', loggerThis.getSandbox(), CallStackLogStore.getTopIid());
            const [chunk] = args as Parameters<typeof Writable.prototype.end>;
            if (isBufferLike(chunk))
            {
                BufferLogStore.appendBufferOperation(chunk, 'write', 'finish',
                    BufferLogStore.getArrayBufferRangeOfArrayBufferView(chunk),
                    getSourceCodeInfoFromIid(CallStackLogStore.getTopIid(), loggerThis.getSandbox()));
            }
            loggerThis.timeConsumed += Date.now() - startTimestamp;
            // @ts-ignore
            return originalWritableEnd.call(this, ...args);
        };

        const originalReadablePipe = Readable.prototype.pipe;
        // @ts-ignore
        Readable.prototype.pipe = function (...args)
        {
            const startTimestamp = Date.now();
            const [destination] = args;
            assert.ok(destination instanceof Writable);
            StreamLogStore.appendStreamOperation(this, 'read', 'read', loggerThis.getSandbox(), CallStackLogStore.getTopIid());
            StreamLogStore.appendStreamOperation(destination, 'read', 'write', loggerThis.getSandbox(), CallStackLogStore.getTopIid());
            loggerThis.timeConsumed += Date.now() - startTimestamp;
            return originalReadablePipe.call(this, ...args);
        };

        const originalReadableRead = Readable.prototype.read;
        Readable.prototype.read = function (...args)
        {
            const startTimestamp = Date.now();
            const result = originalReadableRead.call(this, ...args);
            StreamLogStore.appendStreamOperation(this, 'read', 'read', loggerThis.getSandbox(), CallStackLogStore.getTopIid());
            const data = result as ReturnType<typeof Readable.prototype.read>;
            if (isBufferLike(data))
            {
                BufferLogStore.appendBufferOperation(data, 'write', 'finish',
                    BufferLogStore.getArrayBufferRangeOfArrayBufferView(data),
                    getSourceCodeInfoFromIid(CallStackLogStore.getTopIid(), loggerThis.getSandbox()));
            }
            loggerThis.timeConsumed += Date.now() - startTimestamp;
            return result;
        };

        const originalReadableUnshift = Readable.prototype.unshift;
        Readable.prototype.unshift = function (...args)
        {
            const startTimestamp = Date.now();
            StreamLogStore.appendStreamOperation(this, 'read', 'write', loggerThis.getSandbox(), CallStackLogStore.getTopIid());
            const [chunk] = args as Parameters<typeof Readable.prototype.unshift>;
            if (isBufferLike(chunk))
            {
                BufferLogStore.appendBufferOperation(chunk, 'read', 'finish',
                    BufferLogStore.getArrayBufferRangeOfArrayBufferView(chunk),
                    getSourceCodeInfoFromIid(CallStackLogStore.getTopIid(), loggerThis.getSandbox()));
            }
            loggerThis.timeConsumed += Date.now() - startTimestamp;
            return originalReadableUnshift.call(this, ...args);
        };

        const originalReadablePush = Readable.prototype.push;
        Readable.prototype.push = function (...args)
        {
            const startTimestamp = Date.now();
            StreamLogStore.appendStreamOperation(this, 'read', 'write', loggerThis.getSandbox(), CallStackLogStore.getTopIid());
            const [chunk] = args as Parameters<typeof Readable.prototype.push>;
            if (isBufferLike(chunk))
            {
                BufferLogStore.appendBufferOperation(chunk, 'read', 'finish',
                    BufferLogStore.getArrayBufferRangeOfArrayBufferView(chunk),
                    getSourceCodeInfoFromIid(CallStackLogStore.getTopIid(), loggerThis.getSandbox()));
            }
            loggerThis.timeConsumed += Date.now() - startTimestamp;
            return originalReadablePush.call(this, ...args);
        };
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, _base, args) =>
        {
            const startTimestamp = Date.now();

            if (f === pipeline
                /* || f === pipelinePromise */) // Node 15
            {
                const parameters = args as Parameters<typeof pipeline>;
                let streams = [];
                if (Array.isArray(parameters[0]))
                {
                    streams = parameters[0];
                }
                else
                {
                    streams = parameters.slice(0, -1);
                }

                const source = streams[0];
                const destination = streams[streams.length - 1];
                const transformers = streams.slice(1, -1);
                if (source instanceof Readable)
                {
                    StreamLogStore.appendStreamOperation(source, 'read', 'read', this.getSandbox(), iid);
                }
                if (destination instanceof Writable)
                {
                    StreamLogStore.appendStreamOperation(destination, 'read', 'write', this.getSandbox(), iid);
                }
                for (const transformer of transformers)
                {
                    if (transformer instanceof Readable || transformer instanceof Writable)
                    {
                        StreamLogStore.appendStreamOperation(transformer, 'read', 'write', this.getSandbox(), iid);
                        StreamLogStore.appendStreamOperation(transformer, 'read', 'read', this.getSandbox(), iid);
                    }
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`Stream: ${this.timeConsumed / 1000}s`);
            }
        };
    }
}