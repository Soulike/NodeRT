// DO NOT INSTRUMENT

import buffer from 'buffer';
import {strict as assert} from 'assert';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {LastExpressionValueLogStore} from '../../LogStore/LastExpressionValueLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isArrayAccess, isBufferLike} from '../../Util';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import util from 'util';
import {isObject} from 'lodash';
import {IteratorLogStore} from '../../LogStore/IteratorLogStore';

export class BufferOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public forObject: Hooks['forObject'] | undefined;
    public getField: Hooks['getField'] | undefined;
    public putFieldPre: Hooks['putFieldPre'] | undefined;

    private static readonly readOnlyApis: Set<Function> = new Set([
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

    private static readonly writeOnlyApis: Set<Function> = new Set([
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

    protected override registerHooks(): void
    {
        this.invokeFun = (iid, f, base, args, result) =>
        {
            if (f === Buffer.alloc)
            {
                if (isBufferLike(args[1]))
                {
                    BufferLogStore.appendBufferOperation(args[1], 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                assert.ok(isBufferLike(result));
                BufferLogStore.appendBufferOperation(result, 'write',
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (f === Buffer.allocUnsafe
                || f === Buffer.allocUnsafeSlow)
            {
                assert.ok(isBufferLike(result));
                BufferLogStore.appendBufferOperation(result, 'write',
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (f === Buffer.byteLength)
            {
                if (isBufferLike(args[0]))
                {
                    BufferLogStore.appendBufferOperation(args[0], 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
            else if (f === Buffer.compare)
            {
                assert.ok(isBufferLike(args[0]));
                assert.ok(isBufferLike(args[1]));
                BufferLogStore.appendBufferOperation(args[0], 'read',
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
                BufferLogStore.appendBufferOperation(args[1], 'read',
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (f === Buffer.concat)
            {
                assert.ok(Array.isArray(args[0]));
                ObjectLogStore.appendObjectOperation(args[0], 'read', this.getSandbox(), iid);
                for (const arg of args[0])
                {
                    assert.ok(isBufferLike(arg));
                    BufferLogStore.appendBufferOperation(arg, 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                assert.ok(isBufferLike(result));
                BufferLogStore.appendBufferOperation(result, 'write',
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (f === Buffer.from || f === Buffer)
            {
                if (Buffer.isBuffer(args[0]) || util.types.isTypedArray(args[0]))
                {
                    BufferLogStore.appendBufferOperation(args[0], 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (util.types.isAnyArrayBuffer(args[0]))
                {
                    // pass
                }
                else if (Array.isArray(args[0]) || isObject(args[0]))
                {
                    ObjectLogStore.appendObjectOperation(args[0], 'read', this.getSandbox(), iid);
                }
                assert.ok(isBufferLike(result));
                BufferLogStore.appendBufferOperation(result, 'write',
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (f === buffer.transcode)
            {
                assert.ok(isBufferLike(args[0]));
                BufferLogStore.appendBufferOperation(args[0], 'read',
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
                assert.ok(isBufferLike(result));
                BufferLogStore.appendBufferOperation(result, 'write',
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (f === Buffer.isBuffer
                || f === Buffer.isEncoding
                || f === Buffer.prototype.keys)
            {
                // pass
            }
            else if (util.types.isTypedArray(base))
            {
                if (f === Buffer.prototype.compare
                    || f === Buffer.prototype.equals)
                {
                    BufferLogStore.appendBufferOperation(base, 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    assert.ok(isBufferLike(args[0]));
                    BufferLogStore.appendBufferOperation(args[0], 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === Buffer.prototype.copy)
                {
                    BufferLogStore.appendBufferOperation(base, 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    assert.ok(isBufferLike(args[0]));
                    BufferLogStore.appendBufferOperation(args[0], 'write',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === Buffer.prototype.entries
                    || f === Buffer.prototype.values)
                {
                    IteratorLogStore.addIterator(
                        result as IterableIterator<any>,
                        base);
                }
                else if (f === Buffer.prototype.fill)
                {
                    if (isBufferLike(args[0]))
                    {
                        BufferLogStore.appendBufferOperation(args[0], 'read',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                    BufferLogStore.appendBufferOperation(base, 'write',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === Buffer.prototype.includes
                    || f === Buffer.prototype.indexOf
                    || f === Buffer.prototype.lastIndexOf)
                {
                    if (isBufferLike(args[0]))
                    {
                        BufferLogStore.appendBufferOperation(args[0], 'read',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                    BufferLogStore.appendBufferOperation(base, 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (BufferOperationLogger.readOnlyApis.has(f))
                {
                    BufferLogStore.appendBufferOperation(base, 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (BufferOperationLogger.writeOnlyApis.has(f))
                {
                    BufferLogStore.appendBufferOperation(base, 'write',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
        };

        this.getField = (iid, base, offset, _val, isComputed) =>
        {
            if (Buffer.isBuffer(base) && isArrayAccess(isComputed, offset))
            {
                BufferLogStore.appendBufferOperation(base, 'read', this.getSandbox(), iid);
            }
        };

        this.putFieldPre = (iid, base, offset, _val, isComputed) =>
        {
            if (Buffer.isBuffer(base) && isArrayAccess(isComputed, offset))
            {
                BufferLogStore.appendBufferOperation(base, 'write', this.getSandbox(), iid);
            }
        };

        this.forObject = (iid, isForIn) =>
        {
            const lastExpressionValue = LastExpressionValueLogStore.getLastExpressionValue();
            if (!isForIn && Buffer.isBuffer(lastExpressionValue))
            {
                BufferLogStore.appendBufferOperation(lastExpressionValue, 'read', this.getSandbox(), iid);
            }
        };
    }
}