// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import util from 'util';
import {appendBufferOperation} from './Util';
import {strict as assert} from 'assert';

class ArrayBufferOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    private readonly appendBufferOperation = appendBufferOperation.bind(this);

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks(): void
    {
        this.invokeFun = (iid, f, base, args, result, isConstructor, isMethod, functionIid, functionSid) =>
        {
            if (f === ArrayBuffer)
            {
                assert.ok(util.types.isArrayBuffer(result));
                this.appendBufferOperation(result, 'write', iid);
            }
            else if (util.types.isAnyArrayBuffer(base))
            {
                if (f === ArrayBuffer.prototype.slice)
                {
                    this.appendBufferOperation(base, 'read', iid);
                    assert.ok(util.types.isArrayBuffer(result));
                    this.appendBufferOperation(result, 'write', iid);
                }
            }
            else if (f === SharedArrayBuffer)
            {
                assert.ok(util.types.isSharedArrayBuffer(result));
                this.appendBufferOperation(result, 'write', iid);
            }
            else if (util.types.isSharedArrayBuffer(base))
            {
                if (f === SharedArrayBuffer.prototype.slice)
                {
                    this.appendBufferOperation(base, 'read', iid);
                    assert.ok(util.types.isSharedArrayBuffer(result));
                    this.appendBufferOperation(result, 'write', iid);
                }
            }
        };
    }

}

export default ArrayBufferOperationLogger;