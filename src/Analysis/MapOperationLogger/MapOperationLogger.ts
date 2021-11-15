// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import {isObject} from 'lodash';
import {IteratorLogStore} from '../../LogStore/IteratorLogStore';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {shouldBeVerbose} from '../../Util';

export class MapOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public invokeFunPre: Hooks['invokeFunPre'] | undefined;
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

            if (base instanceof Map)
            {
                if (f === Map.prototype.clear)
                {
                    if (base.size !== 0)
                    {
                        ObjectLogStore.appendObjectOperation(base, 'write', base.keys(), false, this.getSandbox(), iid);
                    }
                }
                else if (f === Map.prototype.set)
                {
                    const [key, value] = args as Parameters<typeof Map.prototype.set>;
                    if (base.get(key) !== value)
                    {
                        ObjectLogStore.appendObjectOperation(base, 'write', [key], false, this.getSandbox(), iid);
                    }
                }
                else if (f === Map.prototype.delete)
                {
                    const [key] = args as Parameters<typeof Map.prototype.delete>;
                    if (base.has(key))
                    {
                        ObjectLogStore.appendObjectOperation(base, 'write', [key], false, this.getSandbox(), iid);
                    }
                }
                else if (f === Map.prototype.forEach)
                {
                    ObjectLogStore.appendObjectOperation(base, 'read', base.keys(), false, this.getSandbox(), iid);
                }
                else if (f === Map.prototype.has)
                {
                    const [key] = args as Parameters<typeof Map.prototype.has>;
                    ObjectLogStore.appendObjectOperation(base, 'read', [key], false, this.getSandbox(), iid);
                }
                else if (f === Map.prototype.get)
                {
                    const [key] = args as Parameters<typeof Map.prototype.get>;
                    ObjectLogStore.appendObjectOperation(base, 'read', [key], false, this.getSandbox(), iid);
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.invokeFun = (iid, f, base, args, result) =>
        {
            const startTimestamp = Date.now();

            if (f === Map)
            {
                if (isObject(args[0]))
                {
                    ObjectLogStore.appendObjectOperation(args[0], 'read', Object.keys(args[0]), false, this.getSandbox(), iid);
                }
                assert.ok(result instanceof Map);
                ObjectLogStore.appendObjectOperation(result, 'write', result.keys(), true, this.getSandbox(), iid);
            }
            else if (base instanceof Map)
            {
                if (f === Map.prototype[Symbol.iterator]
                    || f === Map.prototype.entries
                    || f === Map.prototype.values)
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
                console.log(`Map: ${this.timeConsumed / 1000}s`);
            }
        };
    }
}