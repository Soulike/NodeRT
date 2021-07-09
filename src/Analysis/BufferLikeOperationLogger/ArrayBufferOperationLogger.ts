// DO NOT INSTRUMENT

import Analysis from '../../Type/Analysis';
import Sandbox from '../../Type/Sandbox';
import Hooks from '../../Type/Hooks';
import util from 'util';
import {appendBufferOperation} from './Util';
import {strict as assert} from 'assert';

class ArrayBufferOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public getField: Hooks['getField'] | undefined;
    public putFieldPre: Hooks['putFieldPre'] | undefined;
    private readonly appendBufferOperation = appendBufferOperation.bind(this);

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks(): void
    {
        this.getField = (iid, base, offset, val, isComputed, isOpAssign, isMethodCall) =>
        {
            if (util.types.isAnyArrayBuffer(base))
            {
                this.appendBufferOperation(base, 'read', iid);
            }
        };

        this.putFieldPre = (iid, base, offset, val, isComputed, isOpAssign) =>
        {
            if (util.types.isAnyArrayBuffer(base))
            {
                this.appendBufferOperation(base, 'write', iid);
            }
        };

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