// DO NOT INSTRUMENT

import assert from 'assert';
import {ClientRequest, OutgoingMessage, ServerResponse} from 'http';
import {BufferLogStore} from '../../../LogStore/BufferLogStore';
import {OutgoingMessageLogStore} from '../../../LogStore/OutgoingMessageLogStore';
import {SocketLogStore} from '../../../LogStore/SocketLogStore';
import {Analysis, Hooks, Sandbox} from '../../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike, shouldBeVerbose} from '../../../Util';

export class HttpOutgoingMessageOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public endExecution: Hooks['endExecution'] | undefined;

    private timeConsumed: number;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.timeConsumed = 0;
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, base, args, result) =>
        {
            const startTimestamp = Date.now();
            if (f === ClientRequest || f === ServerResponse)
            {
                assert.ok(result instanceof OutgoingMessage);
                OutgoingMessageLogStore.appendOutgoingMessageOperation(result, 'write', 'construction',
                    this.getSandbox(), iid);
            }
            else if (base instanceof OutgoingMessage)
            {
                if (f === OutgoingMessage.prototype.destroy)
                {
                    OutgoingMessageLogStore.appendOutgoingMessageOperation(base, 'write', 'destroy',
                        this.getSandbox(), iid);
                    const socket = base.socket;
                    if (socket !== null)
                    {
                        SocketLogStore.appendSocketOperation(socket, 'write', 'destroy', this.getSandbox(), iid);
                    }
                }
                else if (f === OutgoingMessage.prototype.write)
                {
                    OutgoingMessageLogStore.appendOutgoingMessageOperation(base, 'read', 'write',
                        this.getSandbox(), iid);
                    const socket = base.socket;
                    if (socket !== null)
                    {
                        SocketLogStore.appendSocketOperation(socket, 'read', 'write', this.getSandbox(), iid);
                    }

                    const [chunk] = args as Parameters<typeof OutgoingMessage.prototype.write>;
                    if (isBufferLike(chunk))
                    {
                        BufferLogStore.appendBufferOperation(chunk, 'read', 'finish',
                            BufferLogStore.getArrayBufferRangeOfArrayBufferView(chunk),
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                }
                else if (f === OutgoingMessage.prototype.end)
                {
                    OutgoingMessageLogStore.appendOutgoingMessageOperation(base, 'write', 'end',
                        this.getSandbox(), iid);
                    const socket = base.socket;
                    if (socket !== null)
                    {
                        // socket may not does 'end()'
                        SocketLogStore.appendSocketOperation(socket, 'read', 'write', this.getSandbox(), iid);
                    }

                    const [chunk] = args as Parameters<typeof OutgoingMessage.prototype.end>;
                    if (isBufferLike(chunk))
                    {
                        BufferLogStore.appendBufferOperation(chunk, 'read', 'finish',
                            BufferLogStore.getArrayBufferRangeOfArrayBufferView(chunk),
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`HttpOutgoingMessage: ${this.timeConsumed / 1000}s`);
            }
        };
    }
}