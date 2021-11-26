// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import {isObject} from 'lodash';
import {IteratorLogStore} from '../../LogStore/IteratorLogStore';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {shouldBeVerbose} from '../../Util';

/**Does not support spread expression now*/
export class ArrayOperationLogger extends Analysis
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
        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`Array: ${this.timeConsumed / 1000}s`);
            }
        };

        this.invokeFunPre = (iid, f, base, args) =>
        {
            const startTimestamp = Date.now();

            if (f === Array.isArray
                || f === Array.prototype.keys)
            {
                // pass
            }
            else if (Array.isArray(base))
            {
                if (f === Array.prototype.copyWithin)
                {
                    let [target, start, end] = args as Parameters<typeof Array.prototype.copyWithin>;
                    if (target < 0)
                    {
                        target += base.length;
                    }
                    else if (target >= base.length)
                    {
                        return;
                    }

                    if (start === undefined)
                    {
                        start = 0;
                    }
                    else if (start < 0)
                    {
                        start += base.length;
                    }
                    else if (start >= base.length)
                    {
                        return;
                    }

                    if (end === undefined)
                    {
                        end = base.length;
                    }
                    else if (end < 0)
                    {
                        end += base.length;
                    }
                    else if (end > base.length)
                    {
                        end = base.length;
                    }

                    const readKeys: string[] = [];
                    for (let i = start; i < end; i++)
                    {
                        readKeys.push(`${i}`);
                    }
                    ObjectLogStore.appendObjectOperation(base, 'read', readKeys, false, this.getSandbox(), iid);

                    const writtenLength = end - start;
                    const writtenKeys: string[] = [];
                    for (let i = 0; i < writtenLength; i++)
                    {
                        writtenKeys.push(`${target + i}`);
                    }
                    ObjectLogStore.appendObjectOperation(base, 'write', writtenKeys, false, this.getSandbox(), iid);
                }
                else if (f === Array.prototype.fill)
                {
                    let [, start, end] = args as Parameters<typeof Array.prototype.fill>;
                    if (start === undefined)
                    {
                        start = 0;
                    }
                    else if (start < 0)
                    {
                        start += base.length;
                    }
                    else if (start >= base.length)
                    {
                        return;
                    }

                    if (end === undefined)
                    {
                        end = base.length;
                    }
                    else if (end < 0)
                    {
                        end += base.length;
                    }
                    else if (end > base.length)
                    {
                        end = base.length;
                    }
                    const writtenKeys = [];
                    for (let i = start; i < end; i++)
                    {
                        writtenKeys.push(i);
                    }
                    ObjectLogStore.appendObjectOperation(base, 'write', writtenKeys, false, this.getSandbox(), iid);
                }
                else if (f === Array.prototype.reverse
                    || f === Array.prototype.sort)
                {
                    ObjectLogStore.appendObjectOperation(base, 'write', Object.keys(base), false, this.getSandbox(), iid);
                }
                else if (f === Array.prototype.shift)
                {
                    ObjectLogStore.appendObjectOperation(base, 'write', [...Object.keys(base), 'length'], false, this.getSandbox(), iid);
                }
                else if (f === Array.prototype.splice)
                {
                    let [start, deleteCount, ...items] = args as Parameters<typeof Array.prototype.splice>;
                    if (start > base.length)
                    {
                        start = base.length;
                    }
                    else if (start < 0)
                    {
                        start += base.length;
                    }
                    if (deleteCount === undefined || deleteCount >= base.length - start)
                    {
                        deleteCount = base.length - start;
                    }
                    else if (deleteCount <= 0)
                    {
                        deleteCount = 0;
                    }

                    const writtenKeys: string[] = [];
                    if (items.length === deleteCount)
                    {
                        for (let i = 0; i < deleteCount; i++)
                        {
                            writtenKeys.push(`${start + i}`);
                        }
                    }
                    else
                    {
                        for (let i = start; i < base.length; i++)
                        {
                            writtenKeys.push(`${i}`);
                        }
                        writtenKeys.push('length');
                    }
                    ObjectLogStore.appendObjectOperation(base, 'write', writtenKeys, false, this.getSandbox(), iid);
                }
                else if (f === Array.prototype.push
                    || f === Array.prototype.pop)
                {
                    ObjectLogStore.appendObjectOperation(base, 'write', [`${base.length}`, 'length'], false, this.getSandbox(), iid);
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
                    ObjectLogStore.appendObjectOperation(base, 'read', Object.keys(base), false, this.getSandbox(), iid);
                }
                else if (f === Array.prototype.slice)
                {
                    let [begin, end] = args as Parameters<typeof Array.prototype.slice>;
                    if (end === undefined)
                    {
                        end = base.length;
                    }
                    else if (end < 0)
                    {
                        end = base.length + end;
                    }
                    else if (end > base.length)
                    {
                        end = base.length;
                    }

                    if (begin === undefined)
                    {
                        begin = 0;
                    }
                    else if (begin < 0)
                    {
                        begin = base.length + begin;
                    }
                    else if (begin >= base.length || begin > end)
                    {
                        begin = end;
                    }

                    const keys: string[] = [];
                    for (let i = begin; i < end; i++)
                    {
                        keys.push(`${i}`);
                    }
                    ObjectLogStore.appendObjectOperation(base, 'read', keys, false, this.getSandbox(), iid);
                    // result is logged in invokeFun
                }

                this.timeConsumed += Date.now() - startTimestamp;
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
                ObjectLogStore.appendObjectOperation(result, 'write', Object.keys(result), true, this.getSandbox(), iid);
            }
            else if (f === Array.from)
            {
                const arrayLike = args[0];
                assert.ok(isObject(arrayLike));
                ObjectLogStore.appendObjectOperation(arrayLike, 'read', Object.keys(arrayLike), false, this.getSandbox(), iid);
                assert.ok(isObject(result));
                ObjectLogStore.appendObjectOperation(result, 'write', Object.keys(result), true, this.getSandbox(), iid);
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
                    const arrays = args as Parameters<typeof Array.prototype.concat>;
                    for (const array of arrays)
                    {
                        if (isObject(array))
                        {
                            ObjectLogStore.appendObjectOperation(array, 'read', Object.keys(array), false, this.getSandbox(), iid);
                        }
                    }
                    assert.ok(isObject(result));
                    ObjectLogStore.appendObjectOperation(result, 'write', Object.keys(result), true, this.getSandbox(), iid);
                }
                else if (f === Array.prototype.unshift)
                {
                    ObjectLogStore.appendObjectOperation(base, 'write', [...Object.keys(base), 'length'], false, this.getSandbox(), iid);
                }
                else if (f === Array.prototype.filter
                    || f === Array.prototype.flat
                    || f === Array.prototype.flatMap
                    || f === Array.prototype.map)
                {
                    ObjectLogStore.appendObjectOperation(base, 'read', Object.keys(base), false, this.getSandbox(), iid);
                    assert.ok(isObject(result));
                    ObjectLogStore.appendObjectOperation(result, 'write', Object.keys(result), true, this.getSandbox(), iid);
                }
                else if (f === Array.prototype.slice)
                {
                    assert.ok(isObject(result));
                    ObjectLogStore.appendObjectOperation(result, 'write', Object.keys(result), true, this.getSandbox(), iid);
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;

        };
    }
}