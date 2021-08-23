// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {strict as assert} from 'assert';
import {isObject} from 'lodash';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {IteratorLogStore} from '../../LogStore/IteratorLogStore';

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
        this.invokeFun = (iid, f, base, args, result) =>
        {
            if (f === Set)
            {
                if (isObject(args[0]))
                {
                    ObjectLogStore.appendObjectOperation(args[0], 'read', this.getSandbox(), iid);
                }
                assert.ok(result instanceof Set);
                ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
            }
            else if (f === Set.prototype[Symbol.iterator]
                || f === Set.prototype.entries
                || f === Set.prototype.values)
            {
                assert.ok(isObject(result));
                assert.ok(isObject(base));
                IteratorLogStore.addIterator(result as Iterator<any>, base);
            }
            else if (f === Set.prototype.add
                || f === Set.prototype.clear
                || f === Set.prototype.delete)
            {
                assert.ok(isObject(base));
                ObjectLogStore.appendObjectOperation(base, 'write', this.getSandbox(), iid);
            }
            else if (f === Set.prototype.forEach
                || f === Set.prototype.has)
            {
                assert.ok(isObject(base));
                ObjectLogStore.appendObjectOperation(base, 'read', this.getSandbox(), iid);
            }
        };
    }
}