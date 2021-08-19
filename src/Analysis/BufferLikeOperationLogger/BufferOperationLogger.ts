// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import buffer from 'buffer';
import {LastExpressionValueLogStore} from '../../LogStore/LastExpressionValueLogStore';
import {isArrayAccess, logObjectArgsAsReadOperation, logObjectBaseAsReadOperation, logObjectBaseAsWriteOperation, logObjectResultAsWriteOperation} from '../../Util';
import {BufferLogStore} from '../../LogStore/BufferLogStore';

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

    protected override registerHooks(): void
    {
        this.invokeFun = (iid, f, base, args, result) =>
        {
            if (f === Buffer.alloc
                || f === Buffer.allocUnsafe
                || f === Buffer.allocUnsafeSlow
                || f === Buffer
                || f === Buffer.from
                || f === Buffer.compare
                || f === Buffer.concat
                || f === Buffer.prototype.toJSON
                || f === buffer.transcode)
            {
                logObjectArgsAsReadOperation(args, this.getSandbox(), iid);
                logObjectResultAsWriteOperation(result, this.getSandbox(), iid);
            }
            else if (Buffer.isBuffer(base))
            {
                if (f === Buffer.prototype.entries
                    || f === Buffer.prototype.keys
                    || f === Buffer.prototype.values
                    || f === Buffer.prototype[Symbol.iterator]
                    || f === Buffer.prototype.compare
                    || f === Buffer.prototype.equals)
                {
                    logObjectBaseAsReadOperation(base, this.getSandbox(), iid);
                    logObjectArgsAsReadOperation(args, this.getSandbox(), iid);
                }
                else if (f === Buffer.prototype.copy)
                {
                    logObjectBaseAsReadOperation(base, this.getSandbox(), iid);
                    const targetBuffer = args[0] as Parameters<typeof Buffer.prototype.copy>[0];
                    BufferLogStore.appendBufferOperation(targetBuffer, 'write', this.getSandbox(), iid);
                }
                else if (f === Buffer.prototype.fill)
                {
                    logObjectBaseAsWriteOperation(base, this.getSandbox(), iid);
                    logObjectArgsAsReadOperation(args, this.getSandbox(), iid);
                }
                else if (f === Buffer.prototype.includes
                    || f === Buffer.prototype.indexOf
                    || f === Buffer.prototype.lastIndexOf)
                {
                    logObjectBaseAsReadOperation(base, this.getSandbox(), iid);
                    logObjectArgsAsReadOperation(args, this.getSandbox(), iid);
                }
                // @ts-ignore
                else if (BufferOperationLogger.readOnlyApis.has(f))
                {
                    logObjectBaseAsReadOperation(base, this.getSandbox(), iid);
                }
                // @ts-ignore
                else if (BufferOperationLogger.writeOnlyApis.has(f))
                {
                    logObjectBaseAsWriteOperation(base, this.getSandbox(), iid);
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