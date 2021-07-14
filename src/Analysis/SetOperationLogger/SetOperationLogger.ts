// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {strict as assert} from 'assert';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';

export class SetOperationLogger extends Analysis
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
            const readMethods: Function[] = [Set.prototype.forEach, Set.prototype.has];
            const writeMethods: Function[] = [Set.prototype.add, Set.prototype.delete, Set.prototype.clear];
            if (f === Set && isConstructor)
            {
                assert.ok(result instanceof Set);
                ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
            }
            else if (base instanceof Set)
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