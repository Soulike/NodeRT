// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {logObjectArgsAsReadOperation, logObjectBaseAsReadOperation, logObjectBaseAsWriteOperation, logObjectResultAsWriteOperation} from '../../LogStore/LoggerFunction';

export class SetOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;

    private static readonly readMethods: Set<Function> = new Set([Set.prototype.forEach, Set.prototype.has]);
    private static readonly writeMethods: Set<Function> = new Set([Set.prototype.add, Set.prototype.delete, Set.prototype.clear]);

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, base, args, result) =>
        {   
            if (f === Set
                || f === Set.prototype.entries
                || f === Set.prototype.keys
                || f === Set.prototype.values
                || f === Set.prototype[Symbol.iterator])
            {   
                logObjectArgsAsReadOperation(args, this.getSandbox(), iid);
                logObjectResultAsWriteOperation(result, this.getSandbox(), iid);
            }
            else if (base instanceof Set)
            {
                if (SetOperationLogger.readMethods.has(f))
                {
                    logObjectBaseAsReadOperation(base, this.getSandbox(), iid);
                }
                else if (SetOperationLogger.writeMethods.has(f))
                {
                    logObjectBaseAsWriteOperation(base, this.getSandbox(), iid);
                }
            }
        };
    }
}