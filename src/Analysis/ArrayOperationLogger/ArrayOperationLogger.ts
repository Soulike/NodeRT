// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {strict as assert} from 'assert';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';

/**Does not support spread expression now*/
export class ArrayOperationLogger extends Analysis
{
    public literal: Hooks['literal'] | undefined;
    public invokeFun: Hooks['invokeFun'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks()
    {
        const sandbox = this.getSandbox();

        this.invokeFun = (iid, f, base, args, result) =>
        {
            if (f === Array || f === Array.of)
            {
                assert.ok(Array.isArray(result));
                ObjectLogStore.appendObjectOperation(result, 'write', sandbox, iid);
            }
            else if (f === Array.from)
            {
                const iterable = args[0];
                if (Array.isArray(iterable))    // TODO: TypedArray
                {
                    ObjectLogStore.appendObjectOperation(iterable, 'read', sandbox, iid);
                }
                assert.ok(Array.isArray(result));
                ObjectLogStore.appendObjectOperation(result, 'write', sandbox, iid);
            }
            else if (f === Array.prototype.concat)
            {
                const arg = args[0] as Parameters<typeof Array.prototype.concat>[0];
                if (Array.isArray(arg))
                {
                    ObjectLogStore.appendObjectOperation(arg, 'read', sandbox, iid);
                }

                assert.ok(Array.isArray(base));
                ObjectLogStore.appendObjectOperation(base, 'read', sandbox, iid);

                assert.ok(Array.isArray(result));
                ObjectLogStore.appendObjectOperation(result, 'write', sandbox, iid);
            }
            else if (f === Array.prototype.copyWithin)
            {
                assert.ok(Array.isArray(base));
                ObjectLogStore.appendObjectOperation(base, 'read', sandbox, iid);
                ObjectLogStore.appendObjectOperation(base, 'write', sandbox, iid);
            }
            else if (f === Array.prototype.entries || f === Array.prototype.keys || f === Array.prototype.values
                || f === Array.prototype.every || f === Array.prototype.find || f === Array.prototype.findIndex
                || f === Array.prototype.indexOf || f === Array.prototype.lastIndexOf
                || f === Array.prototype.forEach || f === Array.prototype.includes
                || f === Array.prototype.join || f === Array.prototype.reduce || f === Array.prototype.reduceRight
                || f === Array.prototype.some || f === Array.prototype.toString || f === Array.prototype.toLocaleString
            )
            {
                assert.ok(Array.isArray(base));
                ObjectLogStore.appendObjectOperation(base, 'read', sandbox, iid);
            }
            else if (f === Array.prototype.fill)
            {
                if (Array.isArray(base))
                {
                    ObjectLogStore.appendObjectOperation(base, 'write', sandbox, iid);
                }
            }
            else if (f === Array.prototype.pop || f === Array.prototype.push || f === Array.prototype.shift
                || f === Array.prototype.reverse || f === Array.prototype.sort || f === Array.prototype.unshift)
            {
                assert.ok(Array.isArray(base));
                ObjectLogStore.appendObjectOperation(base, 'write', sandbox, iid);
            }
            else if (f === Array.prototype.filter
                || f === Array.prototype.flat
                || f === Array.prototype.flatMap  // for performance, flat() is not precise, should be recursive
                || f === Array.prototype.map
                || f === Array.prototype.slice)
            {
                assert.ok(Array.isArray(base));
                ObjectLogStore.appendObjectOperation(base, 'read', sandbox, iid);

                assert.ok(Array.isArray(result));
                ObjectLogStore.appendObjectOperation(result, 'write', sandbox, iid);
            }
            else if (f === Array.prototype.splice)
            {
                assert.ok(Array.isArray(base));
                ObjectLogStore.appendObjectOperation(base, 'write', sandbox, iid);

                assert.ok(Array.isArray(result));
                ObjectLogStore.appendObjectOperation(result, 'write', sandbox, iid);
            }
        };
    }
}