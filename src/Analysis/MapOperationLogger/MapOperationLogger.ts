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

            if (f === Map)
            {
                if (isObject(args[0]))
                {
                    ObjectLogStore.appendObjectOperation(args[0], 'read', null, this.getSandbox(), iid);
                }
                assert.ok(result instanceof Map);
                ObjectLogStore.appendObjectOperation(result, 'write', null, this.getSandbox(), iid);
            }
            else if (base instanceof Map)
            {
                if (f === Map.prototype[Symbol.iterator]
                    || f === Map.prototype.entries
                    || f === Map.prototype.values)
                {
                    assert.ok(isObject(result));
                    assert.ok(isObject(base));
                    IteratorLogStore.addIterator(result as Iterator<any>, base);
                }
                else if (f === Map.prototype.clear)
                {
                    assert.ok(isObject(base));
                    ObjectLogStore.appendObjectOperation(base, 'write', null, this.getSandbox(), iid);
                }
                else if (f === Map.prototype.delete
                    || f === Map.prototype.set)
                {
                    assert.ok(isObject(base));
                    const [key] = args as Parameters<typeof Map.prototype.delete
                        | typeof Map.prototype.set>;
                    ObjectLogStore.appendObjectOperation(base, 'write', key, this.getSandbox(), iid);
                }
                else if (f === Map.prototype.forEach
                    || f === Map.prototype.has)
                {
                    assert.ok(isObject(base));
                    ObjectLogStore.appendObjectOperation(base, 'read', null, this.getSandbox(), iid);
                }
                else if (f === Map.prototype.get)
                {
                    assert.ok(isObject(base));
                    const [key] = args as Parameters<typeof Map.prototype.get>;
                    ObjectLogStore.appendObjectOperation(base, 'read', key, this.getSandbox(), iid);
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