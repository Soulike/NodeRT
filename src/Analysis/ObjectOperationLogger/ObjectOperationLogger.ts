// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import {isObject, isSymbol} from 'lodash';
import {LastExpressionValueLogStore} from '../../LogStore/LastExpressionValueLogStore';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {isBufferLike} from '../../Util';

export class ObjectOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public putFieldPre: Hooks['putFieldPre'] | undefined;
    public getField: Hooks['getField'] | undefined;
    public literal: Hooks['literal'] | undefined;
    public forObject: Hooks['forObject'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks(): void
    {
        this.literal = (iid, val, _fakeHasGetterSetter) =>
        {
            if (isObject(val))
            {
                ObjectLogStore.appendObjectOperation(val, 'write', this.getSandbox(), iid);
            }
        };

        this.forObject = (iid, isForIn) =>
        {
            if (!isForIn)
            {
                const lastExpressValue = LastExpressionValueLogStore.getLastExpressionValue();
                assert.ok(isObject(lastExpressValue));
                if (!isBufferLike(lastExpressValue))
                {
                    ObjectLogStore.appendObjectOperation(lastExpressValue, 'read', this.getSandbox(), iid);
                }
            }
        };

        this.getField = (iid, base, offset) =>
        {
            if (isBufferLike(base))
            {
                if (isSymbol(offset) || !Number.isInteger(Number.parseInt(offset)))  // not buffer[index]
                {
                    ObjectLogStore.appendObjectOperation(base, 'read', this.getSandbox(), iid);
                }
            }
            else if (isObject(base))
            {
                ObjectLogStore.appendObjectOperation(base, 'read', this.getSandbox(), iid);
            }
        };

        this.putFieldPre = (iid, base, offset) =>
        {
            if (isBufferLike(base))
            {
                if (isSymbol(offset) || !Number.isInteger(Number.parseInt(offset)))  // not buffer[index]
                {
                    ObjectLogStore.appendObjectOperation(base, 'write', this.getSandbox(), iid);
                }
            }
            else if (isObject(base))
            {
                ObjectLogStore.appendObjectOperation(base, 'write', this.getSandbox(), iid);
            }
        };

        // Object.prototype and Object static methods only
        this.invokeFun = (iid, f, base, args, result) =>
        {
            if (f === Object)
            {
                if (args.length === 0 || !isObject(args[0]))
                {
                    assert.ok(isObject(result));
                    ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
                }
                else if (f === Object.assign)
                {
                    const [target, ...sources] = args as Parameters<typeof Object.assign>;
                    ObjectLogStore.appendObjectOperation(target, 'write', this.getSandbox(), iid);
                    for (const source of sources)
                    {
                        assert.ok(isObject(source));
                        ObjectLogStore.appendObjectOperation(source, 'read', this.getSandbox(), iid);
                    }
                }
                else if (f === Object.create)
                {
                    assert.ok(isObject(result));
                    ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
                }
                else if (f === Object.defineProperties
                    || f === Object.defineProperty)
                {
                    assert.ok(isObject(args[0]));
                    ObjectLogStore.appendObjectOperation(args[0], 'write', this.getSandbox(), iid);
                }
                else if (f === Object.entries
                    || f === Object.values)
                {
                    assert.ok(isObject(base));
                    ObjectLogStore.appendObjectOperation(base, 'read', this.getSandbox(), iid);
                    assert.ok(isObject(result));
                    ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
                }
                else if (f === Object.fromEntries)
                {
                    assert.ok(isObject(args[0]));
                    ObjectLogStore.appendObjectOperation(args[0], 'read', this.getSandbox(), iid);
                    assert.ok(isObject(result));
                    ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
                }
                else if (f === Object.prototype.toLocaleString
                    || f === Object.prototype.toString
                    || f === Object.prototype.valueOf)
                {
                    assert.ok(isObject(base));
                    ObjectLogStore.appendObjectOperation(base, 'read', this.getSandbox(), iid);
                }
            }
        };
    }
}