// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {strict as assert} from 'assert';
import util from 'util';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {getSourceCodeInfoFromIid} from '../../Util';

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
        this.invokeFun = (iid, f, base, _args, result) =>
        {
            if (f === ArrayBuffer
                || f === SharedArrayBuffer)
            {
                assert(util.types.isAnyArrayBuffer(result));
                BufferLogStore.appendBufferOperation(result, 'write',
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (f === ArrayBuffer.isView)
            {
                // pass
            }
            else if (f === ArrayBuffer.prototype.slice
                || f === SharedArrayBuffer.prototype.slice)
            {
                assert.ok(util.types.isAnyArrayBuffer(base));
                BufferLogStore.appendBufferOperation(base, 'read',
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
                assert.ok(util.types.isAnyArrayBuffer(result));
                BufferLogStore.appendBufferOperation(result, 'write',
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
        };
    }

}