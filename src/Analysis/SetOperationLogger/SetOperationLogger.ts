// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import {isObject} from 'lodash';
import {IteratorLogStore} from '../../LogStore/IteratorLogStore';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {shouldBeVerbose} from '../../Util';

export class SetOperationLogger extends Analysis
{
    public invokeFunPre: Hooks['invokeFunPre'] | undefined;
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
        this.invokeFunPre = (iid, f, base, args) =>
        {
            const startTimestamp = Date.now();

            if (base instanceof Set)
            {
                if (f === Set.prototype.add)
                {
                    const [value] = args as Parameters<typeof Set.prototype.add>;
                    if (!base.has(value))
                    {
                        ObjectLogStore.appendObjectOperation(base, 'write', [value], false, this.getSandbox(), iid);
                    }
                }
                else if (f === Set.prototype.clear)
                {
                    if (base.size !== 0)
                    {
                        ObjectLogStore.appendObjectOperation(base, 'write', base.keys(), false, this.getSandbox(), iid);
                    }
                }
                else if (f === Set.prototype.delete)
                {
                    const [value] = args as Parameters<typeof Set.prototype.delete>;
                    if (base.has(value))
                    {
                        ObjectLogStore.appendObjectOperation(base, 'write', [value], false, this.getSandbox(), iid);
                    }
                }
                else if (f === Set.prototype.forEach)
                {
                    ObjectLogStore.appendObjectOperation(base, 'read', base.keys(), false, this.getSandbox(), iid);
                }
                else if (f === Set.prototype.has)
                {
                    ObjectLogStore.appendObjectOperation(base, 'read', [args[0]], false, this.getSandbox(), iid);
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.invokeFun = (iid, f, base, args, result) =>
        {
            const startTimestamp = Date.now();

            if (f === Set)
            {
                if (isObject(args[0]))
                {
                    ObjectLogStore.appendObjectOperation(args[0], 'read', Object.keys(args[0]), false, this.getSandbox(), iid);
                }
                assert.ok(result instanceof Set);
                ObjectLogStore.appendObjectOperation(result, 'write', result.keys(), true, this.getSandbox(), iid);
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