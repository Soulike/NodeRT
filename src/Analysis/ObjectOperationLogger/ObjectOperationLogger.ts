// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {strict as assert} from 'assert';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {LastExpressionValueLogStore} from '../../LogStore/LastExpressionValueLogStore';
import {isObject, isSymbol} from 'lodash';
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
            if (val instanceof Object)
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
            else
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
            else
            {
                ObjectLogStore.appendObjectOperation(base, 'write', this.getSandbox(), iid);
            }
        };

        // Object.prototype and Object static methods only
        this.invokeFun = (iid, f, base, args, result) =>
        {
            if (f === Object.assign)
            {
                const [target, ...sources] = args as Parameters<typeof Object.assign>;
                ObjectLogStore.appendObjectOperation(target, 'write', this.getSandbox(), iid);
                sources.forEach(source =>
                {
                    if (isObject(source))
                    {
                        ObjectLogStore.appendObjectOperation(source, 'read', this.getSandbox(), iid);
                    }
                });
            }
            else if (f === Object.create)
            {
                const propertiesObject = args[1] as Parameters<typeof Object.create>[1];
                const newObject = result as ReturnType<typeof Object.create>;
                ObjectLogStore.appendObjectOperation(propertiesObject, 'read', this.getSandbox(), iid);
                ObjectLogStore.appendObjectOperation(newObject, 'write', this.getSandbox(), iid);
            }
            else if (f === Object.defineProperty)
            {
                const [obj, _, descriptor] = args as Parameters<typeof Object.defineProperty>;
                if (isObject(obj))
                {
                    ObjectLogStore.appendObjectOperation(obj, 'write', this.getSandbox(), iid);
                }
                ObjectLogStore.appendObjectOperation(descriptor, 'read', this.getSandbox(), iid);
            }
            else if (f === Object.defineProperties)
            {
                const [obj, props] = args as Parameters<typeof Object.defineProperties>;
                if (isObject(obj))
                {
                    ObjectLogStore.appendObjectOperation(obj, 'write', this.getSandbox(), iid);
                }
                ObjectLogStore.appendObjectOperation(props, 'read', this.getSandbox(), iid);
            }
            else if (f === Object)
            {
                assert.ok(isObject(result));
                ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
            }
            else if (isObject(base))
            {
                if (f === Object.prototype.toString || f === Object.prototype.toLocaleString || f === Object.prototype.valueOf)
                {
                    ObjectLogStore.appendObjectOperation(base, 'read', this.getSandbox(), iid);
                }
            }
        };
    }
}