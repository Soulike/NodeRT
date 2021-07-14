// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {strict as assert} from 'assert';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';

export class MapOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, base, _args, result, isConstructor) =>
        {
            const readMethods: Function[] = [Map.prototype.get, Map.prototype.forEach, Map.prototype.has];
            const writeMethods: Function[] = [Map.prototype.set, Map.prototype.delete, Map.prototype.clear];
            if (f === Map && isConstructor)
            {
                assert.ok(result instanceof Map);
                ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
            }
            else if (base instanceof Map)
            {
                if (readMethods.includes(f))
                {
                    ObjectLogStore.appendObjectOperation(base, 'read', this.getSandbox(), iid);
                }
                else if (writeMethods.includes(f))
                {
                    ObjectLogStore.appendObjectOperation(base, 'write', this.getSandbox(), iid);
                }
            }
        };
    }
}