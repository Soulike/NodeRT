// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import {isFunction, isObject} from 'lodash';
import {LastExpressionValueLogStore} from '../../LogStore/LastExpressionValueLogStore';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {isArrayAccess, isBufferLike, logUnboundFunction, shouldBeVerbose} from '../../Util';

export class ObjectOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public putFieldPre: Hooks['putFieldPre'] | undefined;
    public getField: Hooks['getField'] | undefined;
    public literal: Hooks['literal'] | undefined;
    public forObject: Hooks['forObject'] | undefined;
    public unaryPre: Hooks['unaryPre'] | undefined;
    public endExecution: Hooks['endExecution'] | undefined;

    private timeConsumed: number;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.timeConsumed = 0;
    }

    protected override registerHooks(): void
    {
        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`Object: ${this.timeConsumed / 1000}s`);
            }
        };

        this.literal = (iid, val, _fakeHasGetterSetter) =>
        {
            const startTimestamp = Date.now();

            if (isObject(val))
            {
                ObjectLogStore.appendObjectOperation(val, 'write', Object.keys(val), this.getSandbox(), iid);
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.unaryPre = (iid, op, left) =>
        {
            const startTimestamp = Date.now();

            if (op === 'delete')    // delete obj.a
            {
                // left is like [ { a: 1 }, 'a' ]
                assert.ok(Array.isArray(left) && left.length === 2);
                assert.ok(isObject(left[0]));
                const object = left[0];
                const property = left[1];
                if (Object.prototype.hasOwnProperty.call(object, property))
                {
                    ObjectLogStore.appendObjectOperation(object, 'write', [property], this.getSandbox(), iid);
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.forObject = (iid, isForIn) =>
        {
            const startTimestamp = Date.now();

            if (!isForIn)
            {
                const lastExpressValue = LastExpressionValueLogStore.getLastExpressionValue();
                assert.ok(isObject(lastExpressValue));
                if (!isBufferLike(lastExpressValue))
                {
                    ObjectLogStore.appendObjectOperation(lastExpressValue, 'read', Object.keys(lastExpressValue), this.getSandbox(), iid);
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.getField = (iid, base, offset, _val, isComputed) =>
        {
            const startTimestamp = Date.now();

            if (isBufferLike(base))
            {
                if (!isArrayAccess(isComputed, offset))  // not buffer[index]
                {
                    ObjectLogStore.appendObjectOperation(base, 'read', [offset], this.getSandbox(), iid);
                }
            }
            else if (isObject(base))
            {
                if (Object.hasOwnProperty.bind(base)(offset))
                {
                    ObjectLogStore.appendObjectOperation(base, 'read', [offset], this.getSandbox(), iid);
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.putFieldPre = (iid, base, offset, val, isComputed) =>
        {
            const startTimestamp = Date.now();

            assert.ok(isObject(base));
            // @ts-ignore
            if (base[offset] !== val)
            {
                if (offset === 'length' && Array.isArray(base))
                {
                    const newLength = typeof val === 'number'
                        ? val
                        : Number.parseInt(val as string);
                    if (!Number.isInteger(newLength))
                    {
                        return;
                    }

                    const writtenKeys: string[] = [];
                    const ownKeys = new Set(Object.keys(base));
                    if (newLength < base.length) // shrink
                    {
                        for (let i = newLength; i < base.length; i++)
                        {
                            if (ownKeys.has(`${i}`))    // ignore empty slots
                            {
                                writtenKeys.push(`${i}`);
                            }
                        }
                    }
                    else    // enlarge
                    {
                        // only length changes, pass
                    }
                    ObjectLogStore.appendObjectOperation(base, 'write', [...writtenKeys, 'length'], this.getSandbox(), iid);
                }
                else if (isBufferLike(base))
                {
                    if (!isArrayAccess(isComputed, offset))  // not buffer[index]
                    {
                        ObjectLogStore.appendObjectOperation(base, 'write', [offset], this.getSandbox(), iid);
                    }
                }
                else if (isObject(base))
                {
                    ObjectLogStore.appendObjectOperation(base, 'write', [offset], this.getSandbox(), iid);
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        // Object.prototype and Object static methods only
        this.invokeFun = (iid, f, base, args, result) =>
        {
            const startTimestamp = Date.now();

            if (f === Object)
            {
                if (args.length === 0 || !isObject(args[0]))
                {
                    assert.ok(isObject(result));
                    ObjectLogStore.appendObjectOperation(result, 'write', Object.keys(result), this.getSandbox(), iid);
                }
                else if (f === Object.assign)
                {
                    const [target, ...sources] = args as Parameters<typeof Object.assign>;
                    const writtenKeys: string[] = [];
                    for (const source of sources)
                    {
                        assert.ok(isObject(source));
                        ObjectLogStore.appendObjectOperation(source, 'read', Object.keys(source), this.getSandbox(), iid);
                        writtenKeys.push(...Object.keys(source));
                    }
                    ObjectLogStore.appendObjectOperation(target, 'write', writtenKeys, this.getSandbox(), iid);
                }
                else if (f === Object.create)
                {
                    assert.ok(isObject(result));
                    ObjectLogStore.appendObjectOperation(result, 'write', Object.keys(result), this.getSandbox(), iid);
                }
                else if (f === Object.defineProperties)
                {
                    const [obj, props] = args as Parameters<typeof Object.defineProperties>;
                    assert.ok(isObject(obj));
                    const writtenKeys = Object.keys(props);
                    ObjectLogStore.appendObjectOperation(args[0], 'write', writtenKeys, this.getSandbox(), iid);
                }
                else if (f === Object.defineProperty)
                {
                    const [obj, prop] = args as Parameters<typeof Object.defineProperty>;
                    assert.ok(isObject(obj));
                    ObjectLogStore.appendObjectOperation(obj, 'write', [prop], this.getSandbox(), iid);
                }
                else if (f === Object.entries
                    || f === Object.values)
                {
                    assert.ok(isObject(base));
                    ObjectLogStore.appendObjectOperation(base, 'read', Object.keys(base), this.getSandbox(), iid);
                    assert.ok(isObject(result));
                    ObjectLogStore.appendObjectOperation(result, 'write', Object.keys(result), this.getSandbox(), iid);
                }
                else if (f === Object.fromEntries)
                {
                    assert.ok(isObject(args[0]));
                    ObjectLogStore.appendObjectOperation(args[0], 'read', Object.keys(args[0]), this.getSandbox(), iid);
                    assert.ok(isObject(result));
                    ObjectLogStore.appendObjectOperation(result, 'write', Object.keys(result), this.getSandbox(), iid);
                }
                else if (f === Object.prototype.toLocaleString
                    || f === Object.prototype.toString
                    || f === Object.prototype.valueOf)
                {
                    assert.ok(isObject(base));
                    ObjectLogStore.appendObjectOperation(base, 'read', Object.keys(base), this.getSandbox(), iid);
                }
            }
            else if (f === Function.prototype.bind)
            {
                /*
                 * When a bound function is called,
                 * NodeProf.js can only provide original unbound instance in the hooks.
                 * So we need to log original unbound function instance.
                 */
                assert.ok(isFunction(base));
                assert.ok(isFunction(result));
                logUnboundFunction(base, result);
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };
    }
}