// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {isObject} from 'lodash';
import {getSourceCodeInfoFromIid, isBufferLike} from '../../Util';
import {BufferLogStore} from '../../LogStore/BufferLogStore';

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
                for (const arg of args)
                {
                    if (isObject(arg))
                    {
                        ObjectLogStore.appendObjectOperation(arg, 'read', this.getSandbox(), iid);
                        if (isBufferLike(arg))
                        {
                            BufferLogStore.appendBufferOperation(arg, 'read',
                                getSourceCodeInfoFromIid(iid, this.getSandbox()));
                        }
                    }
                }

                if (isObject(result))
                {
                    ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
                    if (isBufferLike(result))
                    {
                        BufferLogStore.appendBufferOperation(result, 'write',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                }
            }
            else if (base instanceof Set)
            {
                if (SetOperationLogger.readMethods.has(f))
                {
                    ObjectLogStore.appendObjectOperation(base, 'read', this.getSandbox(), iid);
                }
                else if (SetOperationLogger.writeMethods.has(f))
                {
                    ObjectLogStore.appendObjectOperation(base, 'write', this.getSandbox(), iid);
                }
            }
        };
    }
}