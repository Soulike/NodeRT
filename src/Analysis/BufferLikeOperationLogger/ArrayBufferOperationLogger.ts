// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {strict as assert} from 'assert';
import {logObjectArgsAsReadOperation, logObjectBaseAsReadOperation, logObjectResultAsWriteOperation} from '../../Util';
import {isObject} from 'lodash';

export class ArrayBufferOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks(): void
    {
        this.invokeFun = (iid, f, base, args, result) =>
        {
            if (f === ArrayBuffer
            || f === SharedArrayBuffer)
            {
                logObjectArgsAsReadOperation(args, this.getSandbox(), iid);
                logObjectResultAsWriteOperation(result, this.getSandbox(), iid);
            }
            else if (f === ArrayBuffer.prototype.slice
                || f === SharedArrayBuffer.prototype.slice)
            {
                assert.ok(isObject(base));
                logObjectBaseAsReadOperation(base, this.getSandbox(), iid);
                logObjectResultAsWriteOperation(result, this.getSandbox(), iid);
            }
        };
    }

}