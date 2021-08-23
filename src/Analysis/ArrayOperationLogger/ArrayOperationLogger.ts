// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {strict as assert} from 'assert';
import {isObject} from 'lodash';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';

/**Does not support spread expression now*/
export class ArrayOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;

    private readonly iteratorToIteratee: WeakMap<IterableIterator<any>, object>;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.iteratorToIteratee = new WeakMap();

        this.registerHooks();
    }

    protected override registerHooks()
    {
        // The literals of Arrays are logged in ObjectOperationLogger

        this.invokeFun = (iid, f, base, args, result) =>
        {
            if (f === Array
                || f === Array.of)
            {
                assert.ok(isObject(result));
                ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
            }
            else if (f === Array.prototype[Symbol.iterator]
                || f === Array.prototype.entries
                || f === Array.prototype.values)
            {
                assert.ok(isObject(base));
                this.iteratorToIteratee.set(
                    result as IterableIterator<any>,
                    base);
            }
            else if (f === Array.prototype.concat)
            {
                assert.ok(isObject(base));
                ObjectLogStore.appendObjectOperation(base, 'read', this.getSandbox(), iid);
                for (const arg of args)
                {
                    assert.ok(isObject(arg));
                    ObjectLogStore.appendObjectOperation(arg, 'read', this.getSandbox(), iid);
                }
                assert.ok(isObject(result));
                ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
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
                assert.ok(isObject(base));
                ObjectLogStore.appendObjectOperation(base, 'write', this.getSandbox(), iid);
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
                assert.ok(isObject(base));
                ObjectLogStore.appendObjectOperation(base, 'read', this.getSandbox(), iid);
            }
            else if (f === Array.prototype.filter
                || f === Array.prototype.flat
                || f === Array.prototype.flatMap
                || f === Array.prototype.map
                || f === Array.prototype.slice)
            {
                assert.ok(isObject(base));
                ObjectLogStore.appendObjectOperation(base, 'read', this.getSandbox(), iid);
                assert.ok(isObject(result));
                ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
            }
            else if (f === Array.from)
            {
                const arrayLike = args[0];
                assert.ok(isObject(arrayLike));
                ObjectLogStore.appendObjectOperation(arrayLike, 'read', this.getSandbox(), iid);
                assert.ok(isObject(result));
                ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
            }
            else if (f === Array.isArray
                || f === Array.prototype.keys)
            {
                // pass
            }
            else if (this.iteratorToIteratee.has(base as any))
            {
                const iteratee = this.iteratorToIteratee.get(base as IterableIterator<any>)!;
                ObjectLogStore.appendObjectOperation(iteratee, 'read', this.getSandbox(), iid);
            }
        };
    }
}