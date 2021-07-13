// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {strict as assert} from 'assert';
import buffer from 'buffer';
import {appendBufferOperation} from './Util';
import {LastExpressionValueLogStore} from '../../LogStore/LastExpressionValueLogStore';
import {isArrayAccess} from '../../Util';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';

export class BufferOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public forObject: Hooks['forObject'] | undefined;
    public getField: Hooks['getField'] | undefined;
    public putFieldPre: Hooks['putFieldPre'] | undefined;

    private static readonly readOnlyApis: Set<(...args: any[]) => any> = new Set([
        Buffer.prototype.readBigInt64BE,
        Buffer.prototype.readBigInt64LE,
        Buffer.prototype.readBigUInt64BE,
        Buffer.prototype.readBigUInt64LE,
        Buffer.prototype.readDoubleBE,
        Buffer.prototype.readDoubleLE,
        Buffer.prototype.readFloatBE,
        Buffer.prototype.readFloatLE,
        Buffer.prototype.readInt8,
        Buffer.prototype.readInt16BE,
        Buffer.prototype.readInt16LE,
        Buffer.prototype.readInt32BE,
        Buffer.prototype.readInt32LE,
        Buffer.prototype.readIntBE,
        Buffer.prototype.readIntLE,
        Buffer.prototype.readUInt8,
        Buffer.prototype.readUInt16BE,
        Buffer.prototype.readUInt16LE,
        Buffer.prototype.readUInt32BE,
        Buffer.prototype.readUInt32LE,
        Buffer.prototype.readUIntBE,
        Buffer.prototype.readUIntLE,
        Buffer.prototype.toJSON,
        Buffer.prototype.toString,
    ]);

    private static readonly writeOnlyApis: Set<(...args: any[]) => any> = new Set([
        Buffer.prototype.swap16,
        Buffer.prototype.swap32,
        Buffer.prototype.swap64,
        Buffer.prototype.write,
        Buffer.prototype.writeBigInt64BE,
        Buffer.prototype.writeBigInt64LE,
        Buffer.prototype.writeBigUInt64BE,
        Buffer.prototype.writeBigUInt64LE,
        Buffer.prototype.writeDoubleBE,
        Buffer.prototype.writeDoubleLE,
        Buffer.prototype.writeFloatBE,
        Buffer.prototype.writeFloatLE,
        Buffer.prototype.writeInt8,
        Buffer.prototype.writeInt16BE,
        Buffer.prototype.writeInt16LE,
        Buffer.prototype.writeInt32BE,
        Buffer.prototype.writeInt32LE,
        Buffer.prototype.writeIntBE,
        Buffer.prototype.writeIntLE,
        Buffer.prototype.writeUInt8,
        Buffer.prototype.writeUInt16BE,
        Buffer.prototype.writeUInt16LE,
        Buffer.prototype.writeUInt32BE,
        Buffer.prototype.writeUInt32LE,
        Buffer.prototype.writeUIntBE,
        Buffer.prototype.writeUIntLE,
    ]);

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    private appendBufferOperation = appendBufferOperation.bind(this);

    protected override registerHooks(): void
    {
        this.invokeFun = (iid, f, base, args, result) =>
        {
            if (f === Buffer.alloc)
            {
                assert.ok(Buffer.isBuffer(result));
                this.appendBufferOperation(result, 'write', iid);
                const fill = args[1] as Parameters<typeof Buffer.alloc>[1];
                if (fill instanceof Uint8Array)
                {
                    this.appendBufferOperation(fill, 'read', iid);
                }
            }
            else if (f === Buffer.allocUnsafe || f === Buffer.allocUnsafeSlow)
            {
                assert.ok(Buffer.isBuffer(result));
                this.appendBufferOperation(result, 'write', iid);
            }
            else if (f === Buffer || f === Buffer.from)
            {
                if (args[0] instanceof Uint8Array || args[0] instanceof ArrayBuffer || args[0] instanceof SharedArrayBuffer)
                {
                    const readBuffer = args[0];
                    this.appendBufferOperation(readBuffer, 'read', iid);
                }
                else if (Array.isArray(args[0]))
                {
                    ObjectLogStore.appendObjectOperation(args[0], 'read', this.getSandbox(), iid);
                }
                assert.ok(Buffer.isBuffer(result));
                this.appendBufferOperation(result, 'write', iid);
            }
            else if (f === Buffer.compare)
            {
                const buffer1 = args[0] as Parameters<typeof Buffer.compare>[0];
                const buffer2 = args[1] as Parameters<typeof Buffer.compare>[1];
                this.appendBufferOperation(buffer1, 'read', iid);
                this.appendBufferOperation(buffer2, 'read', iid);
            }
            else if (f === Buffer.concat)
            {
                const list = args[0] as Parameters<typeof Buffer.concat>[0];
                ObjectLogStore.appendObjectOperation(list, 'read', this.getSandbox(), iid);

                const returnedBuffer = result as ReturnType<typeof Buffer.concat>;
                for (const buffer of list)
                {
                    this.appendBufferOperation(buffer, 'read', iid);
                }
                this.appendBufferOperation(returnedBuffer, 'write', iid);
            }
            else if (Buffer.isBuffer(base))
            {
                if (f === Buffer.prototype.compare || f === Buffer.prototype.equals)
                {
                    const sourceBuffer = base as Buffer;
                    const targetBuffer = args[0] as Parameters<typeof Buffer.prototype.compare | typeof Buffer.prototype.equals>[0];
                    this.appendBufferOperation(sourceBuffer, 'read', iid);
                    this.appendBufferOperation(targetBuffer, 'read', iid);
                }
                else if (f === Buffer.prototype.copy)
                {
                    const sourceBuffer = base as Buffer;
                    const targetBuffer = args[0] as Parameters<typeof Buffer.prototype.copy>[0];
                    this.appendBufferOperation(sourceBuffer, 'read', iid);
                    this.appendBufferOperation(targetBuffer, 'write', iid);
                }
                else if (f === Buffer.prototype.fill)
                {
                    if (args[0] instanceof Uint8Array)
                    {
                        const readBuffer = args[0];
                        this.appendBufferOperation(readBuffer, 'read', iid);
                    }
                    assert.ok(Buffer.isBuffer(base));
                    this.appendBufferOperation(base, 'write', iid);
                }
                else if (f === Buffer.prototype.includes || f === Buffer.prototype.indexOf || f === Buffer.prototype.lastIndexOf)
                {
                    if (args[0] instanceof Uint8Array)
                    {
                        const readBuffer = args[0];
                        this.appendBufferOperation(readBuffer, 'read', iid);
                    }
                    assert.ok(Buffer.isBuffer(base));
                    this.appendBufferOperation(base, 'read', iid);
                }
                // @ts-ignore
                else if (BufferOperationLogger.readOnlyApis.has(f))
                {
                    assert.ok(Buffer.isBuffer(base));
                    this.appendBufferOperation(base, 'read', iid);
                }
                // subarray() is inherent from TypedArray, so there is no need to log here
                else if (f === Buffer.prototype.slice) // shares the same memory, so no 'write' here
                {
                    assert.ok(Buffer.isBuffer(base));
                    this.appendBufferOperation(base, 'read', iid);
                }
                // @ts-ignore
                else if (BufferOperationLogger.writeOnlyApis.has(f))
                {
                    assert.ok(Buffer.isBuffer(base));
                    this.appendBufferOperation(base, 'write', iid);
                }
            }
            else if (f === buffer.transcode)
            {
                const sourceBuffer = args[0] as Parameters<typeof buffer.transcode>[0];
                const returnedBuffer = result;
                assert.ok(Buffer.isBuffer(returnedBuffer));
                this.appendBufferOperation(sourceBuffer, 'read', iid);
                this.appendBufferOperation(returnedBuffer, 'write', iid);
            }
        };

        this.getField = (iid, base, offset, _val, isComputed) =>
        {
            if (Buffer.isBuffer(base) && isArrayAccess(isComputed, offset))
            {
                this.appendBufferOperation(base, 'read', iid);
            }
        };

        this.putFieldPre = (iid, base, offset, _val, isComputed) =>
        {
            if (Buffer.isBuffer(base) && isArrayAccess(isComputed, offset))
            {
                this.appendBufferOperation(base, 'write', iid);
            }
        };

        this.forObject = (iid, isForIn) =>
        {
            const lastExpressionValue = LastExpressionValueLogStore.getLastExpressionValue();
            if (!isForIn && Buffer.isBuffer(lastExpressionValue))
            {
                this.appendBufferOperation(lastExpressionValue, 'read', iid);
            }
        };
    }
}