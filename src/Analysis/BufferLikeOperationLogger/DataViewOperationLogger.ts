// DO NOT INSTRUMENT

import {appendBufferOperation} from './Util';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import util from 'util';

class DataViewOperationLogger extends Analysis
{
    private static readonly getApis: Set<typeof DataView.prototype.getInt8> = new Set([
        DataView.prototype.getInt8,
        DataView.prototype.getUint8,
        DataView.prototype.getInt16,
        DataView.prototype.getUint16,
        DataView.prototype.getInt32,
        DataView.prototype.getUint32,
        DataView.prototype.getFloat32,
        DataView.prototype.getFloat64,
    ]);
    private static readonly setApis: Set<typeof DataView.prototype.setInt8> = new Set([
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
    public getField: Hooks['getField'] | undefined;
    public putFieldPre: Hooks['putFieldPre'] | undefined;
    private readonly appendBufferOperation = appendBufferOperation.bind(this);

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected registerHooks(): void
    {
        this.getField = (iid, base, offset, val, isComputed, isOpAssign, isMethodCall) =>
        {
            if (util.types.isDataView(base))
            {
                this.appendBufferOperation(base, 'read', iid);
            }
        };

        this.putFieldPre = (iid, base, offset, val, isComputed, isOpAssign) =>
        {
            if (util.types.isDataView(base))
            {
                this.appendBufferOperation(base, 'write', iid);
            }
        };

        this.invokeFun = (iid, f, base, args, result, isConstructor, isMethod, functionIid, functionSid) =>
        {
            if (util.types.isDataView(base))
            {
                // @ts-ignore
                if (DataViewOperationLogger.getApis.has(f))
                {
                    this.appendBufferOperation(base, 'read', iid);
                }
                // @ts-ignore
                else if (DataViewOperationLogger.setApis.has(f))
                {
                    this.appendBufferOperation(base, 'write', iid);
                }
            }
        };
    }
}

export default DataViewOperationLogger;