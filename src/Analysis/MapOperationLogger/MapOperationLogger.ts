// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {logObjectArgsAsReadOperation, logObjectBaseAsReadOperation, logObjectBaseAsWriteOperation, logObjectResultAsWriteOperation} from '../../Util';

export class MapOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;

    private static readonly readMethods: Set<Function> = new Set([Map.prototype.get, Map.prototype.forEach, Map.prototype.has]);
    private static readonly writeMethods: Set<Function> = new Set([Map.prototype.set, Map.prototype.delete, Map.prototype.clear]);

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, base, args, result) =>
        {
            if (f === Map
                || f === Map.prototype[Symbol.iterator]
                || f === Map.prototype.values
                || f === Map.prototype.keys
                || f === Map.prototype.entries)
            {
                logObjectArgsAsReadOperation(args, this.getSandbox(), iid);
                logObjectResultAsWriteOperation(result, this.getSandbox(), iid);
            }
            else if (base instanceof Map)
            {
                if (MapOperationLogger.readMethods.has(f))
                {
                    logObjectBaseAsReadOperation(base, this.getSandbox(), iid);
                }
                else if (MapOperationLogger.writeMethods.has(f))
                {
                    logObjectBaseAsWriteOperation(base, this.getSandbox(), iid);
                }
            }
        };
    }
}