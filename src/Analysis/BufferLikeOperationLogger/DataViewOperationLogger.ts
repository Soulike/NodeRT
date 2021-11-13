// DO NOT INSTRUMENT

import util from 'util';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, shouldBeVerbose} from '../../Util';

export class DataViewOperationLogger extends Analysis
{
    private static readonly get8Apis: Set<Function> = new Set([
        DataView.prototype.getInt8,
        DataView.prototype.getUint8,
    ]);
    private static readonly get16Apis: Set<Function> = new Set([
        DataView.prototype.getInt16,
        DataView.prototype.getUint16,
    ]);
    private static readonly get32Apis: Set<Function> = new Set([
        DataView.prototype.getInt32,
        DataView.prototype.getUint32,
        DataView.prototype.getFloat32,
    ]);
    private static readonly get64Apis: Set<Function> = new Set([
        DataView.prototype.getBigUint64,
        DataView.prototype.getBigInt64,
        DataView.prototype.getFloat64,
    ]);
    private static readonly set8Apis: Set<Function> = new Set([
        DataView.prototype.setInt8,
        DataView.prototype.setUint8,
    ]);
    private static readonly set16Apis: Set<Function> = new Set([
        DataView.prototype.setInt16,
        DataView.prototype.setUint16,
    ]);
    private static readonly set32Apis: Set<Function> = new Set([
        DataView.prototype.setInt32,
        DataView.prototype.setUint32,
        DataView.prototype.setFloat32,
    ]);
    private static readonly set64Apis: Set<Function> = new Set([
        DataView.prototype.setBigUint64,
        DataView.prototype.setBigInt64,
        DataView.prototype.setFloat64,
    ]);

    public invokeFun: Hooks['invokeFun'] | undefined;
    public endExecution: Hooks['endExecution'] | undefined;

    private timeConsumed: number;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.timeConsumed = 0;
    }

    protected registerHooks(): void
    {
        this.invokeFun = (iid, f, base) =>
        {
            const startTimestamp = Date.now();

            if (util.types.isDataView(base))
            {
                if (DataViewOperationLogger.get8Apis.has(f))
                {
                    BufferLogStore.appendBufferOperation(base.buffer, 'read', 'finish', {
                            start: base.byteOffset,
                            end: base.byteOffset + 1,
                        },
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (DataViewOperationLogger.get16Apis.has(f))
                {
                    BufferLogStore.appendBufferOperation(base.buffer, 'read', 'finish', {
                            start: base.byteOffset,
                            end: base.byteOffset + 2,
                        },
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (DataViewOperationLogger.get32Apis.has(f))
                {
                    BufferLogStore.appendBufferOperation(base.buffer, 'read', 'finish', {
                            start: base.byteOffset,
                            end: base.byteOffset + 3,
                        },
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (DataViewOperationLogger.get64Apis.has(f))
                {
                    BufferLogStore.appendBufferOperation(base.buffer, 'read', 'finish', {
                            start: base.byteOffset,
                            end: base.byteOffset + 4,
                        },
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (DataViewOperationLogger.set8Apis.has(f))
                {
                    BufferLogStore.appendBufferOperation(base.buffer, 'write', 'finish', {
                            start: base.byteOffset,
                            end: base.byteOffset + 1,
                        },
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (DataViewOperationLogger.set16Apis.has(f))
                {
                    BufferLogStore.appendBufferOperation(base.buffer, 'write', 'finish', {
                            start: base.byteOffset,
                            end: base.byteOffset + 2,
                        },
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (DataViewOperationLogger.set32Apis.has(f))
                {
                    BufferLogStore.appendBufferOperation(base.buffer, 'write', 'finish', {
                            start: base.byteOffset,
                            end: base.byteOffset + 3,
                        },
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (DataViewOperationLogger.set64Apis.has(f))
                {
                    BufferLogStore.appendBufferOperation(base.buffer, 'write', 'finish', {
                            start: base.byteOffset,
                            end: base.byteOffset + 4,
                        },
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`DataView: ${this.timeConsumed / 1000}s`);
            }
        };
    }
}