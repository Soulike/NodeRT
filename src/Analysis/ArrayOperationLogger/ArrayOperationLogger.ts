// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {strict as assert} from 'assert';
import {logObjectArgsAsReadOperation, logObjectBaseAsReadOperation, logObjectBaseAsWriteOperation, logObjectResultAsWriteOperation} from '../../LogStore/LoggerFunction';
import {isObject} from 'lodash';

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
        this.invokeFun = (iid, f, base, args, result) =>
        {
            if (f === Array
                || f === Array.of
                || f === Array.from
                || f === Array.prototype[Symbol.iterator]
                || f === Array.prototype.values
                || f === Array.prototype.keys
                || f === Array.prototype.entries)
            {
                logObjectArgsAsReadOperation(args, this.getSandbox(), iid);
                logObjectResultAsWriteOperation(result, this.getSandbox(), iid);
            }
            else if (f === Array.prototype.concat)
            {
                logObjectArgsAsReadOperation(args, this.getSandbox(), iid);
                logObjectResultAsWriteOperation(result, this.getSandbox(), iid);
                assert.ok(isObject(base));
                logObjectBaseAsReadOperation(base, this.getSandbox(), iid);
            }
            else if (f === Array.prototype.copyWithin
                || f === Array.prototype.fill
                || f === Array.prototype.pop
                || f === Array.prototype.push
                || f === Array.prototype.shift
                || f === Array.prototype.reverse
                || f === Array.prototype.sort
                || f === Array.prototype.unshift)
            {
                assert.ok(isObject(base));
                logObjectBaseAsWriteOperation(base, this.getSandbox(), iid);
            }
            else if (f === Array.prototype.every
                || f === Array.prototype.find
                || f === Array.prototype.findIndex
                || f === Array.prototype.indexOf
                || f === Array.prototype.lastIndexOf
                || f === Array.prototype.forEach
                || f === Array.prototype.includes
                || f === Array.prototype.join
                || f === Array.prototype.reduce
                || f === Array.prototype.reduceRight
                || f === Array.prototype.some
                || f === Array.prototype.toString
                || f === Array.prototype.toLocaleString
            )
            {
                assert.ok(isObject(base));
                logObjectBaseAsReadOperation(base, this.getSandbox(), iid);
            }
            else if (f === Array.prototype.filter
                || f === Array.prototype.flat
                || f === Array.prototype.flatMap  // for performance, flat() is not precise, should be recursive
                || f === Array.prototype.map
                || f === Array.prototype.slice)
            {
                assert.ok(isObject(base));
                logObjectBaseAsReadOperation(base, this.getSandbox(), iid);
                logObjectResultAsWriteOperation(result, this.getSandbox(), iid);
            }
            else if (f === Array.prototype.splice)
            {
                assert.ok(isObject(base));
                logObjectBaseAsWriteOperation(base, this.getSandbox(), iid);
                logObjectResultAsWriteOperation(result, this.getSandbox(), iid);
            }
        };
    }
}