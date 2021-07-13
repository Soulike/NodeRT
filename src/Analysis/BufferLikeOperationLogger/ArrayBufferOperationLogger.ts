// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import util from 'util';
import {strict as assert} from 'assert';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';

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
            if (f === ArrayBuffer)
            {
                assert.ok(util.types.isArrayBuffer(result));
                ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
                BufferLogStore.appendBufferOperation(result, 'write', this.getSandbox(), iid);
            }
            else if (util.types.isAnyArrayBuffer(base))
            {
                if (f === ArrayBuffer.prototype.slice)
                {
                    BufferLogStore.appendBufferOperation(base, 'read', this.getSandbox(), iid);
                    assert.ok(util.types.isArrayBuffer(result));
                    ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
                    BufferLogStore.appendBufferOperation(result, 'write', this.getSandbox(), iid);
                }
            }
            else if (f === SharedArrayBuffer)
            {
                assert.ok(util.types.isSharedArrayBuffer(result));
                ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
                BufferLogStore.appendBufferOperation(result, 'write', this.getSandbox(), iid);
            }
            else if (util.types.isSharedArrayBuffer(base))
            {
                if (f === SharedArrayBuffer.prototype.slice)
                {
                    BufferLogStore.appendBufferOperation(base, 'read', this.getSandbox(), iid);
                    assert.ok(util.types.isSharedArrayBuffer(result));
                    ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
                    BufferLogStore.appendBufferOperation(result, 'write', this.getSandbox(), iid);
                }
            }
        };
    }

}