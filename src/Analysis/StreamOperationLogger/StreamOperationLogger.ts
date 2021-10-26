// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import {pipeline, Readable, Transform, Writable} from 'stream';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
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

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, base, args, result) =>
        {
            const startTimestamp = Date.now();

            if (base instanceof Readable || base instanceof Writable)
            {
                if (f === Writable.prototype.destroy
                    || f === Readable.prototype.destroy
                    || f === Transform.prototype.destroy)
                {
                    StreamLogStore.appendStreamOperation(base, 'write', 'destroy', this.getSandbox(), iid);
                }
                else if (f === Writable.prototype.write)
                {
                    StreamLogStore.appendStreamOperation(base, 'read','write', this.getSandbox(), iid);
                    const [chunk] = args as Parameters<typeof Writable.prototype.write>;
                    if (isBufferLike(chunk))
                    {
                        BufferLogStore.appendBufferOperation(chunk, 'read',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                }
                else if (f === Writable.prototype.end)
                {
                    StreamLogStore.appendStreamOperation(base, 'write', 'end',this.getSandbox(), iid);
                    const [chunk] = args as Parameters<typeof Writable.prototype.end>;
                    if (isBufferLike(chunk))
                    {
                        BufferLogStore.appendBufferOperation(chunk, 'write',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                }
                else if (f === Readable.prototype.pipe)
                {
                    assert.ok(base instanceof Readable);
                    const [destination] = args;
                    assert.ok(destination instanceof Writable);
                    StreamLogStore.appendStreamOperation(base, 'read', 'read',this.getSandbox(), iid);
                    StreamLogStore.appendStreamOperation(destination, 'read', 'write',this.getSandbox(), iid);
                }
                else if (f === Readable.prototype.read)
                {
                    assert.ok(base instanceof Readable);
                    StreamLogStore.appendStreamOperation(base, 'read','read', this.getSandbox(), iid);
                    const data = result as ReturnType<typeof Readable.prototype.read>;
                    if (isBufferLike(data))
                    {
                        BufferLogStore.appendBufferOperation(data, 'write',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                }
                else if (f === Readable.prototype.unshift
                    || f === Readable.prototype.push)
                {
                    assert.ok(base instanceof Readable);
                    StreamLogStore.appendStreamOperation(base, 'read','write', this.getSandbox(), iid);
                    const [chunk] = args as Parameters<typeof Readable.prototype.unshift
                        | typeof Readable.prototype.push>;
                    if (isBufferLike(chunk))
                    {
                        BufferLogStore.appendBufferOperation(chunk, 'read',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                }
            }
            else if (f === pipeline
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
                        StreamLogStore.appendStreamOperation(transformer, 'read','write', this.getSandbox(), iid);
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