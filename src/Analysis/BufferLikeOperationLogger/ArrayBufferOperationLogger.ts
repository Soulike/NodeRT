// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {strict as assert} from 'assert';
import util from 'util';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {getSourceCodeInfoFromIid} from '../../Util';

export class ArrayBufferOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public endExecution: Hooks['endExecution'] | undefined;

    private timeConsumed: number;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.timeConsumed = 0;

        this.registerHooks();
    }

    protected override registerHooks(): void
    {
        this.invokeFun = (iid, f, base, _args, result) =>
        {
            const startTimestamp = Date.now();

            if (f === ArrayBuffer
                || f === SharedArrayBuffer)
            {
                assert(util.types.isAnyArrayBuffer(result));
                BufferLogStore.appendBufferOperation(result, 'write',
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (util.types.isAnyArrayBuffer(base))
            {
                if (f === ArrayBuffer.isView)
                {
                    // pass
                }
                else if (f === ArrayBuffer.prototype.slice
                    || f === SharedArrayBuffer.prototype.slice)
                {
                    BufferLogStore.appendBufferOperation(base, 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    assert.ok(util.types.isAnyArrayBuffer(result));
                    BufferLogStore.appendBufferOperation(result, 'write',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            console.log(`ArrayBuffer: ${this.timeConsumed / 1000}s`);
        };
    }

}