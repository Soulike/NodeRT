// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import {isObject} from 'lodash';
import {IteratorLogStore} from '../../LogStore/IteratorLogStore';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {shouldBeVerbose} from '../../Util';

export class SetOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public endExecution: Hooks['endExecution'] | undefined;

    private timeConsumed: number;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.timeConsumed = 0;
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
                    IteratorLogStore.addIterator(result as Iterator<any>, base);
                }
                else if (f === Set.prototype.add)
                {
                    const [value] = args as Parameters<typeof Set.prototype.add>;
                    if (!base.has(value))
                    {
                        ObjectLogStore.appendObjectOperation(base, 'write', value, this.getSandbox(), iid);
                    }
                }
                else if (f === Set.prototype.clear)
                {
                    if (base.size !== 0)
                    {
                        ObjectLogStore.appendObjectOperation(base, 'write', null, this.getSandbox(), iid);
                    }
                }
                else if (f === Set.prototype.delete)
                {
                    const [value] = args as Parameters<typeof Set.prototype.delete>;
                    if (base.has(value))
                    {
                        ObjectLogStore.appendObjectOperation(base, 'write', value, this.getSandbox(), iid);
                    }
                }
                else if (f === Set.prototype.forEach
                    || f === Set.prototype.has)
                {
                    ObjectLogStore.appendObjectOperation(base, 'read', null, this.getSandbox(), iid);
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`Set: ${this.timeConsumed / 1000}s`);
            }
        };
    }
}