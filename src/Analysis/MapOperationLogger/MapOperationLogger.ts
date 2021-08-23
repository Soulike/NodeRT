// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import {isObject} from 'lodash';
import {IteratorLogStore} from '../../LogStore/IteratorLogStore';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';

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
        this.invokeFun = (iid, f, base, args, result) =>
        {
            if (f === Map)
            {
                if (isObject(args[0]))
                {
                    ObjectLogStore.appendObjectOperation(args[0], 'read', this.getSandbox(), iid);
                }
                assert.ok(result instanceof Map);
                ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
            }
            else if (f === Map.prototype[Symbol.iterator]
                || f === Map.prototype.entries
                || f === Map.prototype.values)
            {
                assert.ok(isObject(result));
                assert.ok(isObject(base));
                IteratorLogStore.addIterator(result as Iterator<any>, base);
            }
            else if (f === Map.prototype.clear
                || f === Map.prototype.delete
                || f === Map.prototype.set)
            {
                assert.ok(isObject(base));
                ObjectLogStore.appendObjectOperation(base, 'write', this.getSandbox(), iid);
            }
            else if (f === Map.prototype.forEach
                || f === Map.prototype.get
                || f === Map.prototype.has)
            {
                assert.ok(isObject(base));
                ObjectLogStore.appendObjectOperation(base, 'read', this.getSandbox(), iid);
            }
        };
    }
}