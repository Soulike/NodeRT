// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {strict as assert} from 'assert';
import {isObject} from 'lodash';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {IteratorLogStore} from '../../LogStore/IteratorLogStore';

export class SetOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public endExecution: Hooks['endExecution'] | undefined;

    private timeConsumed: number;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.timeConsumed = 0;

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, base, args, result) =>
        {
            const startTimestamp = Date.now();

            if (f === Set)
            {
                if (isObject(args[0]))
                {
                    ObjectLogStore.appendObjectOperation(args[0], 'read', null, this.getSandbox(), iid);
                }
                assert.ok(result instanceof Set);
                ObjectLogStore.appendObjectOperation(result, 'write', null, this.getSandbox(), iid);
            }
            else if (base instanceof Set)
            {
                if (f === Set.prototype[Symbol.iterator]
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
                    ObjectLogStore.appendObjectOperation(base, 'write', null, this.getSandbox(), iid);
                }
                else if (f === Set.prototype.forEach
                    || f === Set.prototype.has)
                {
                    assert.ok(isObject(base));
                    ObjectLogStore.appendObjectOperation(base, 'read', null, this.getSandbox(), iid);
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            console.log(`Set: ${this.timeConsumed / 1000}s`);
        };
    }
}