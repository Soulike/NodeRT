// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {getSourceCodeInfoFromIid} from '../../Util';
import util from 'util';

export class DataViewOperationLogger extends Analysis
{
    private static readonly getApis: Set<Function> = new Set([
        DataView.prototype.getInt8,
        DataView.prototype.getUint8,
        DataView.prototype.getInt16,
        DataView.prototype.getUint16,
        DataView.prototype.getInt32,
        DataView.prototype.getUint32,
        DataView.prototype.getFloat32,
        DataView.prototype.getFloat64,
    ]);
    private static readonly setApis: Set<Function> = new Set([
        DataView.prototype.setInt8,
        DataView.prototype.setUint8,
        DataView.prototype.setInt16,
        DataView.prototype.setUint16,
        DataView.prototype.setInt32,
        DataView.prototype.setUint32,
        DataView.prototype.setFloat32,
        DataView.prototype.setFloat64,
    ]);
    public invokeFun: Hooks['invokeFun'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected registerHooks(): void
    {
        this.invokeFun = (iid, f, base) =>
        {
            if (util.types.isDataView(base))
            {
                if (DataViewOperationLogger.getApis.has(f))
                {
                    BufferLogStore.appendBufferOperation(base, 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (DataViewOperationLogger.setApis.has(f))
                {
                    BufferLogStore.appendBufferOperation(base, 'write',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
        };
    }
}