// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {isObject} from 'lodash';
import {getSourceCodeInfoFromIid, isBufferLike} from '../../Util';
import {BufferLogStore} from '../../LogStore/BufferLogStore';

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
            else if (base instanceof Map)
            {
                if (MapOperationLogger.readMethods.has(f))
                {
                    ObjectLogStore.appendObjectOperation(base, 'read', this.getSandbox(), iid);
                }
                else if (MapOperationLogger.writeMethods.has(f))
                {
                    ObjectLogStore.appendObjectOperation(base, 'write', this.getSandbox(), iid);
                }
            }
        };
    }
}