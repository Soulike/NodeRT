// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {strict as assert} from 'assert';
import {isObject} from 'lodash';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {IteratorLogStore} from '../../LogStore/IteratorLogStore';
import {shouldBeVerbose} from '../../Util';

/**Does not support spread expression now*/
export class ArrayOperationLogger extends Analysis
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
        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`Array: ${this.timeConsumed / 1000}s`);
            }
        };

        // The literals of Arrays are logged in ObjectOperationLogger

        this.invokeFun = (iid, f, base, args, result) =>
        {
            const startTimestamp = Date.now();

            if (f === Array
                || f === Array.of)
            {
                assert.ok(isObject(result));
                ObjectLogStore.appendObjectOperation(result, 'write', null, this.getSandbox(), iid);
            }
            else if (f === Array.from)
            {
                const arrayLike = args[0];
                assert.ok(isObject(arrayLike));
                ObjectLogStore.appendObjectOperation(arrayLike, 'read', null, this.getSandbox(), iid);
                assert.ok(isObject(result));
                ObjectLogStore.appendObjectOperation(result, 'write', null, this.getSandbox(), iid);
            }
            else if (f === Array.isArray
                || f === Array.prototype.keys)
            {
                // pass
            }
            else if (Array.isArray(base))
            {
                if (f === Array.prototype[Symbol.iterator]
                    || f === Array.prototype.entries
                    || f === Array.prototype.values)
                {
                    IteratorLogStore.addIterator(
                        result as IterableIterator<any>,
                        base);
                }
                else if (f === Array.prototype.concat)
                {
                    assert.ok(isObject(result));
                    ObjectLogStore.appendObjectOperation(result, 'write', null, this.getSandbox(), iid);
                }
                else if (f === Array.prototype.copyWithin
                    || f === Array.prototype.fill
                    || f === Array.prototype.pop
                    || f === Array.prototype.push
                    || f === Array.prototype.reverse
                    || f === Array.prototype.shift
                    || f === Array.prototype.sort
                    || f === Array.prototype.splice
                    || f === Array.prototype.unshift)
                {
                    ObjectLogStore.appendObjectOperation(base, 'write', null, this.getSandbox(), iid);
                }
                else if (f === Array.prototype.every
                    || f === Array.prototype.find
                    || f === Array.prototype.findIndex
                    || f === Array.prototype.forEach
                    || f === Array.prototype.includes
                    || f === Array.prototype.indexOf
                    || f === Array.prototype.join
                    || f === Array.prototype.lastIndexOf
                    || f === Array.prototype.reduce
                    || f === Array.prototype.reduceRight
                    || f === Array.prototype.some
                    || f === Array.prototype.toLocaleString
                    || f === Array.prototype.toString)
                {
                    ObjectLogStore.appendObjectOperation(base, 'read', null, this.getSandbox(), iid);
                }
                else if (f === Array.prototype.filter
                    || f === Array.prototype.flat
                    || f === Array.prototype.flatMap
                    || f === Array.prototype.map
                    || f === Array.prototype.slice)
                {
                    ObjectLogStore.appendObjectOperation(base, 'read', null, this.getSandbox(), iid);
                    assert.ok(isObject(result));
                    ObjectLogStore.appendObjectOperation(result, 'write', null, this.getSandbox(), iid);
                }

                this.timeConsumed += Date.now() - startTimestamp;
            }
        };
    }
}