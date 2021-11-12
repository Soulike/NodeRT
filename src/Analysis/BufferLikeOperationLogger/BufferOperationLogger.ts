// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import buffer from 'buffer';
import {isObject} from 'lodash';
import util from 'util';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {IteratorLogStore} from '../../LogStore/IteratorLogStore';
import {LastExpressionValueLogStore} from '../../LogStore/LastExpressionValueLogStore';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isArrayAccess, shouldBeVerbose} from '../../Util';

export class BufferOperationLogger extends Analysis
{
    private static readonly read8OnlyApis: Set<Function> = new Set([
        Buffer.prototype.readInt8,
        Buffer.prototype.readUInt8,
    ]);
    private static readonly read16OnlyApis: Set<Function> = new Set([
        Buffer.prototype.readInt16BE,
        Buffer.prototype.readInt16LE,
        Buffer.prototype.readUInt16BE,
        Buffer.prototype.readUInt16LE,
    ]);
    private static readonly read32OnlyApis: Set<Function> = new Set([
        Buffer.prototype.readFloatBE,
        Buffer.prototype.readFloatLE,
        Buffer.prototype.readInt32BE,
        Buffer.prototype.readInt32LE,
        Buffer.prototype.readUInt32BE,
        Buffer.prototype.readUInt32LE,
    ]);
    private static readonly read64OnlyApis: Set<Function> = new Set([
        Buffer.prototype.readBigInt64BE,
        Buffer.prototype.readBigInt64LE,
        Buffer.prototype.readBigUInt64BE,
        Buffer.prototype.readBigUInt64LE,
        Buffer.prototype.readDoubleBE,
        Buffer.prototype.readDoubleLE,
    ]);
    private static readonly readOnlyApis: Set<Function> = new Set([
        Buffer.prototype.toJSON,
        Buffer.prototype.toString,
    ]);
    private static readonly write8OnlyApis: Set<Function> = new Set([
        Buffer.prototype.writeInt8,
        Buffer.prototype.writeUInt8,
    ]);
    private static readonly write16OnlyApis: Set<Function> = new Set([
        Buffer.prototype.writeInt16BE,
        Buffer.prototype.writeInt16LE,
        Buffer.prototype.writeUInt16BE,
        Buffer.prototype.writeUInt16LE,
    ]);
    private static readonly write32OnlyApis: Set<Function> = new Set([
        Buffer.prototype.writeFloatBE,
        Buffer.prototype.writeFloatLE,
        Buffer.prototype.writeInt32BE,
        Buffer.prototype.writeInt32LE,
        Buffer.prototype.writeUInt32BE,
        Buffer.prototype.writeUInt32LE,
    ]);
    private static readonly write64OnlyApis: Set<Function> = new Set([
        Buffer.prototype.writeBigInt64BE,
        Buffer.prototype.writeBigInt64LE,
        Buffer.prototype.writeBigUInt64BE,
        Buffer.prototype.writeBigUInt64LE,
        Buffer.prototype.writeDoubleBE,
        Buffer.prototype.writeDoubleLE,
    ]);
    private static readonly writeOnlyApis: Set<Function> = new Set([
        Buffer.prototype.swap16,
        Buffer.prototype.swap32,
        Buffer.prototype.swap64,
    ]);

    public invokeFun: Hooks['invokeFun'] | undefined;
    public forObject: Hooks['forObject'] | undefined;
    public getField: Hooks['getField'] | undefined;
    public putFieldPre: Hooks['putFieldPre'] | undefined;
    public endExecution: Hooks['endExecution'] | undefined;

    private timeConsumed: number;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.timeConsumed = 0;
    }

    protected override registerHooks(): void
    {
        this.invokeFun = (iid, f, base, args, result) =>
        {
            const startTimestamp = Date.now();

            if (f === Buffer.alloc)
            {
                if (util.types.isTypedArray(args[1]))
                {
                    const readKeys = [];
                    for (let i = args[1].byteOffset; i < args[1].byteLength; i++)
                    {
                        readKeys.push(i);
                    }
                    BufferLogStore.appendBufferOperation(args[1].buffer, 'read', 'finish', readKeys,
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                assert.ok(Buffer.isBuffer(result));
                const writtenKeys = [];
                for (let i = result.byteOffset; i < result.byteLength; i++)
                {
                    writtenKeys.push(i);
                }
                BufferLogStore.appendBufferOperation(result.buffer, 'write', 'finish', writtenKeys,
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (f === Buffer.allocUnsafe
                || f === Buffer.allocUnsafeSlow)
            {
                assert.ok(Buffer.isBuffer(result));
                const writtenKeys = [];
                for (let i = result.byteOffset; i < result.byteLength; i++)
                {
                    writtenKeys.push(i);
                }
                BufferLogStore.appendBufferOperation(result.buffer, 'write', 'finish', writtenKeys,
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (f === Buffer.compare)
            {
                const [buf1, buf2] = args as Parameters<typeof Buffer.compare>;
                BufferLogStore.appendBufferOperation(buf1.buffer, 'read', 'finish',
                    BufferLogStore.getArrayBufferFieldsOfArrayBufferView(buf1),
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
                BufferLogStore.appendBufferOperation(buf2.buffer, 'read', 'finish',
                    BufferLogStore.getArrayBufferFieldsOfArrayBufferView(buf2),
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (f === Buffer.concat)
            {
                assert.ok(Array.isArray(args[0]));
                ObjectLogStore.appendObjectOperation(args[0], 'read', Object.keys(args[0]), this.getSandbox(), iid);
                for (const arg of args[0])
                {
                    assert.ok(util.types.isTypedArray(arg));
                    BufferLogStore.appendBufferOperation(arg.buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(arg),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                assert.ok(Buffer.isBuffer(result));
                BufferLogStore.appendBufferOperation(result.buffer, 'write', 'finish',
                    BufferLogStore.getArrayBufferFieldsOfArrayBufferView(result),
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (f === Buffer.from || f === Buffer)
            {
                if (Buffer.isBuffer(args[0]) || util.types.isTypedArray(args[0]))
                {
                    const buffer = args[0];
                    BufferLogStore.appendBufferOperation(buffer.buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(buffer),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (util.types.isAnyArrayBuffer(args[0]))
                {
                    // pass
                }
                else if (Array.isArray(args[0]) || isObject(args[0]))
                {
                    ObjectLogStore.appendObjectOperation(args[0], 'read', Object.keys(args[0]), this.getSandbox(), iid);
                }
                assert.ok(Buffer.isBuffer(result));
                BufferLogStore.appendBufferOperation(result.buffer, 'write', 'finish',
                    BufferLogStore.getArrayBufferFieldsOfArrayBufferView(result),
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (f === buffer.transcode)
            {
                const [source] = args as Parameters<typeof buffer.transcode>;
                BufferLogStore.appendBufferOperation(source.buffer, 'read', 'finish',
                    BufferLogStore.getArrayBufferFieldsOfArrayBufferView(source),
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
                assert.ok(Buffer.isBuffer(result));
                BufferLogStore.appendBufferOperation(result.buffer, 'write', 'finish',
                    BufferLogStore.getArrayBufferFieldsOfArrayBufferView(result),
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
                if (f === Buffer.prototype.compare)
                {
                    let [target, targetStart, targetEnd, sourceStart, sourceEnd] = args as [
                            Buffer | Uint8Array, number?, number?, number?, number?];
                    targetStart ??= 0;
                    targetEnd ??= target.length;
                    sourceStart ??= 0;
                    sourceEnd ??= base.length;

                    BufferLogStore.appendBufferOperation(base.buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(base, sourceStart, sourceEnd),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    BufferLogStore.appendBufferOperation(target.buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(target, targetStart, targetEnd),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                if (f === Buffer.prototype.equals)
                {
                    BufferLogStore.appendBufferOperation(base.buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(base),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    assert.ok(util.types.isTypedArray(args[0]));
                    BufferLogStore.appendBufferOperation(args[0].buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(args[0]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === Buffer.prototype.copy)
                {
                    let [target, targetStart, sourceStart] = args as [
                            Buffer | Uint8Array, number?, number?, number?];
                    targetStart ??= 0;
                    sourceStart ??= 0;
                    assert.ok(typeof result === 'number');
                    if (result !== 0)
                    {
                        BufferLogStore.appendBufferOperation(base.buffer, 'read', 'finish',
                            BufferLogStore.getArrayBufferFieldsOfArrayBufferView(base, sourceStart, sourceStart + result),
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                        BufferLogStore.appendBufferOperation(target.buffer, 'write', 'finish',
                            BufferLogStore.getArrayBufferFieldsOfArrayBufferView(target, targetStart, targetStart + result),
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
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
                    let [value, offset, end] = args as [string | number | Uint8Array | Buffer, number?, number?];
                    if (util.types.isTypedArray(value))
                    {
                        BufferLogStore.appendBufferOperation(value.buffer, 'read', 'finish',
                            BufferLogStore.getArrayBufferFieldsOfArrayBufferView(value),
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                    if (offset === undefined)
                    {
                        offset = 0;
                    }
                    if (end === undefined)
                    {
                        offset = base.length;
                    }
                    BufferLogStore.appendBufferOperation(base.buffer, 'write', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(base, offset, end),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === Buffer.prototype.includes
                    || f === Buffer.prototype.indexOf
                    || f === Buffer.prototype.lastIndexOf)
                {
                    let [value, byteOffset] = args as [string | Buffer | Uint8Array | number, number?];
                    if (byteOffset === undefined)
                    {
                        byteOffset = 0;
                    }
                    if (util.types.isTypedArray(value))
                    {
                        BufferLogStore.appendBufferOperation(value.buffer, 'read', 'finish',
                            BufferLogStore.getArrayBufferFieldsOfArrayBufferView(value),
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                    BufferLogStore.appendBufferOperation(base.buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(base, byteOffset),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (BufferOperationLogger.read8OnlyApis.has(f))
                {
                    let [offset] = args as [number?];
                    if (offset === undefined)
                    {
                        offset = 0;
                    }
                    BufferLogStore.appendBufferOperation(base.buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(base, offset, offset + 1),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (BufferOperationLogger.read16OnlyApis.has(f))
                {
                    let [offset] = args as [number?];
                    if (offset === undefined)
                    {
                        offset = 0;
                    }
                    BufferLogStore.appendBufferOperation(base.buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(base, offset, offset + 2),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (BufferOperationLogger.read32OnlyApis.has(f))
                {
                    let [offset] = args as [number?];
                    if (offset === undefined)
                    {
                        offset = 0;
                    }
                    BufferLogStore.appendBufferOperation(base.buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(base, offset, offset + 4),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (BufferOperationLogger.read64OnlyApis.has(f))
                {
                    let [offset] = args as [number?];
                    if (offset === undefined)
                    {
                        offset = 0;
                    }
                    BufferLogStore.appendBufferOperation(base.buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(base, offset, offset + 8),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (BufferOperationLogger.readOnlyApis.has(f))
                {
                    BufferLogStore.appendBufferOperation(base.buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(base),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (BufferOperationLogger.write8OnlyApis.has(f))
                {
                    let [offset] = args as [number?];
                    if (offset === undefined)
                    {
                        offset = 0;
                    }
                    BufferLogStore.appendBufferOperation(base.buffer, 'write', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(base, offset, offset + 1),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (BufferOperationLogger.write16OnlyApis.has(f))
                {
                    let [offset] = args as [number?];
                    if (offset === undefined)
                    {
                        offset = 0;
                    }
                    BufferLogStore.appendBufferOperation(base.buffer, 'write', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(base, offset, offset + 2),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (BufferOperationLogger.write32OnlyApis.has(f))
                {
                    let [offset] = args as [number?];
                    if (offset === undefined)
                    {
                        offset = 0;
                    }
                    BufferLogStore.appendBufferOperation(base.buffer, 'write', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(base, offset, offset + 4),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (BufferOperationLogger.write64OnlyApis.has(f))
                {
                    let [offset] = args as [number?];
                    if (offset === undefined)
                    {
                        offset = 0;
                    }
                    BufferLogStore.appendBufferOperation(base.buffer, 'write', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(base, offset, offset + 8),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (BufferOperationLogger.writeOnlyApis.has(f))
                {
                    BufferLogStore.appendBufferOperation(base.buffer, 'write', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(base),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === Buffer.prototype.readIntBE
                    || f === Buffer.prototype.readIntLE
                    || f === Buffer.prototype.readUIntBE
                    || f === Buffer.prototype.readUIntLE)
                {
                    const [offset, byteLength] = args as [number, number];
                    BufferLogStore.appendBufferOperation(base.buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(base, offset, offset + byteLength),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === Buffer.prototype.writeIntBE
                    || f === Buffer.prototype.writeIntLE
                    || f === Buffer.prototype.writeUIntBE
                    || f === Buffer.prototype.writeUIntLE)
                {
                    const [offset, byteLength] = args as [number, number];
                    BufferLogStore.appendBufferOperation(base.buffer, 'write', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(base, offset, offset + byteLength),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === Buffer.prototype.write)
                {
                    let [, offset] = args as [string, number?];
                    if (offset === undefined)
                    {
                        offset = 0;
                    }
                    assert.ok(typeof result === 'number');
                    BufferLogStore.appendBufferOperation(base.buffer, 'write', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(base, offset, offset + result),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.getField = (iid, base, offset, _val, isComputed) =>
        {
            const startTimestamp = Date.now();

            if (Buffer.isBuffer(base) && isArrayAccess(isComputed, offset))
            {
                offset = typeof offset === 'number' ? offset : Number.parseInt(offset);
                assert.ok(!Number.isNaN(offset));
                BufferLogStore.appendBufferOperation(base.buffer, 'read', 'finish', [offset], this.getSandbox(), iid);
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.putFieldPre = (iid, base, offset, val, isComputed) =>
        {
            const startTimestamp = Date.now();

            if (Buffer.isBuffer(base) && isArrayAccess(isComputed, offset)
                && base[offset as number] !== val)
            {
                offset = typeof offset === 'number' ? offset : Number.parseInt(offset);
                assert.ok(!Number.isNaN(offset));
                BufferLogStore.appendBufferOperation(base.buffer, 'write', 'finish', [offset], this.getSandbox(), iid);
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.forObject = (iid, isForIn) =>
        {
            const startTimestamp = Date.now();

            const lastExpressionValue = LastExpressionValueLogStore.getLastExpressionValue();
            if (!isForIn && Buffer.isBuffer(lastExpressionValue))
            {
                BufferLogStore.appendBufferOperation(lastExpressionValue.buffer, 'read', 'finish',
                    BufferLogStore.getArrayBufferFieldsOfArrayBufferView(lastExpressionValue),
                    this.getSandbox(), iid);
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`Buffer: ${this.timeConsumed / 1000}s`);
            }
        };
    }
}