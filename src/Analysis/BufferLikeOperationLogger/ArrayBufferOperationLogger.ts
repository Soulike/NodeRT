// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import util from 'util';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, shouldBeVerbose} from '../../Util';

export class ArrayBufferOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public endExecution: Hooks['endExecution'] | undefined;

    private timeConsumed: number;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.timeConsumed = 0;
    }

    protected override registerHooks(): void
    {
        this.invokeFun = (iid, f, base, args, result) =>
        {
            const startTimestamp = Date.now();

            if (f === ArrayBuffer
                || f === SharedArrayBuffer)
            {
                assert.ok(util.types.isAnyArrayBuffer(result));
                BufferLogStore.appendBufferOperation(result, 'write', 'finish', {start: 0, end: 0},
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
                    let [begin, end] = args as Parameters<typeof ArrayBuffer.prototype.slice
                        | typeof SharedArrayBuffer.prototype.slice>;
                    if (end === undefined)
                    {
                        end = base.byteLength;
                    }
                    if (begin >= base.byteLength)
                    {
                        begin = end;
                    }
                    const readKeys = [];
                    for (let i = begin; i < end; i++)
                    {
                        readKeys.push(i);
                    }
                    BufferLogStore.appendBufferOperation(base, 'read', 'finish', {start: begin, end},
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    assert.ok(util.types.isAnyArrayBuffer(result));
                    BufferLogStore.appendBufferOperation(result, 'write', 'finish', {start: 0, end: result.byteLength},
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`ArrayBuffer: ${this.timeConsumed / 1000}s`);
            }
        };
    }

}