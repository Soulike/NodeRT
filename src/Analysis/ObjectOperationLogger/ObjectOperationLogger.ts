// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import {isObject} from 'lodash';
import {LastExpressionValueLogStore} from '../../LogStore/LastExpressionValueLogStore';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {isArrayAccess, isBufferLike, shouldBeVerbose} from '../../Util';

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
                ObjectLogStore.appendObjectOperation(val, 'write', null, this.getSandbox(), iid);
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
                ObjectLogStore.appendObjectOperation(object, 'write', property, this.getSandbox(), iid);
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
                    ObjectLogStore.appendObjectOperation(lastExpressValue, 'read', null, this.getSandbox(), iid);
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.getField = (iid, base, offset,_val, isComputed) =>
        {
            const startTimestamp = Date.now();

            if (isBufferLike(base))
            {
                if (!isArrayAccess(isComputed, offset))  // not buffer[index]
                {
                    ObjectLogStore.appendObjectOperation(base, 'read', offset, this.getSandbox(), iid);
                }
            }
            else if (isObject(base))
            {
                if (Object.hasOwnProperty.bind(base)(offset))
                {
                    ObjectLogStore.appendObjectOperation(base, 'read', offset, this.getSandbox(), iid);
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
                if (isBufferLike(base))
                {
                    if (!isArrayAccess(isComputed, offset))  // not buffer[index]
                    {
                        ObjectLogStore.appendObjectOperation(base, 'write', offset, this.getSandbox(), iid);
                    }
                }
                else if (isObject(base))
                {
                    ObjectLogStore.appendObjectOperation(base, 'write', offset, this.getSandbox(), iid);
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
                    ObjectLogStore.appendObjectOperation(result, 'write', null, this.getSandbox(), iid);
                }
                else if (f === Object.assign)
                {
                    const [target, ...sources] = args as Parameters<typeof Object.assign>;
                    ObjectLogStore.appendObjectOperation(target, 'write', null, this.getSandbox(), iid);
                    for (const source of sources)
                    {
                        assert.ok(isObject(source));
                        ObjectLogStore.appendObjectOperation(source, 'read', null, this.getSandbox(), iid);
                    }
                }
                else if (f === Object.create)
                {
                    assert.ok(isObject(result));
                    ObjectLogStore.appendObjectOperation(result, 'write', null, this.getSandbox(), iid);
                }
                else if (f === Object.defineProperties)
                {
                    assert.ok(isObject(args[0]));
                    ObjectLogStore.appendObjectOperation(args[0], 'write', null, this.getSandbox(), iid);
                }
                else if (f === Object.defineProperty)
                {
                    const [obj, prop] = args as Parameters<typeof Object.defineProperty>;
                    assert.ok(isObject(obj));
                    ObjectLogStore.appendObjectOperation(obj, 'write', prop, this.getSandbox(), iid);
                }
                else if (f === Object.entries
                    || f === Object.values)
                {
                    assert.ok(isObject(base));
                    ObjectLogStore.appendObjectOperation(base, 'read', null, this.getSandbox(), iid);
                    assert.ok(isObject(result));
                    ObjectLogStore.appendObjectOperation(result, 'write', null, this.getSandbox(), iid);
                }
                else if (f === Object.fromEntries)
                {
                    assert.ok(isObject(args[0]));
                    ObjectLogStore.appendObjectOperation(args[0], 'read', null, this.getSandbox(), iid);
                    assert.ok(isObject(result));
                    ObjectLogStore.appendObjectOperation(result, 'write', null, this.getSandbox(), iid);
                }
                else if (f === Object.prototype.toLocaleString
                    || f === Object.prototype.toString
                    || f === Object.prototype.valueOf)
                {
                    assert.ok(isObject(base));
                    ObjectLogStore.appendObjectOperation(base, 'read', null, this.getSandbox(), iid);
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };
    }
}