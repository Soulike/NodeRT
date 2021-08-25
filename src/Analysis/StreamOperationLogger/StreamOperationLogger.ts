// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import {Readable, Transform, Writable} from 'stream';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {StreamLogStore} from '../../LogStore/StreamLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike} from '../../Util';

export class StreamOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, base, args, result) =>
        {
            if (f === Writable.prototype.destroy
                || f === Readable.prototype.destroy
                || f === Transform.prototype.destroy)
            {
                assert.ok(base instanceof Writable || base instanceof Readable);
                StreamLogStore.appendStreamOperation(base, 'write', this.getSandbox(), iid);
            }
            else if (f === Writable.prototype.end
                || f === Writable.prototype.write)
            {
                const [chunk] = args as Parameters<typeof Writable.prototype.end | typeof Writable.prototype.write>;
                if (isBufferLike(chunk))
                {
                    BufferLogStore.appendBufferOperation(chunk, 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
            else if (f === Readable.prototype.pipe)
            {
                assert.ok(base instanceof Readable);
                const [destination] = args;
                assert.ok(destination instanceof Writable);
                StreamLogStore.appendStreamOperation(destination, 'write', this.getSandbox(), iid);
            }
            else if (f === Readable.prototype.read)
            {
                assert.ok(base instanceof Readable);
                StreamLogStore.appendStreamOperation(base, 'read', this.getSandbox(), iid);
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
                StreamLogStore.appendStreamOperation(base, 'write', this.getSandbox(), iid);
                const [chunk] = args as Parameters<typeof Readable.prototype.unshift
                    | typeof Readable.prototype.push>;
                if (isBufferLike(chunk))
                {
                    BufferLogStore.appendBufferOperation(chunk, 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
        };
    }
}