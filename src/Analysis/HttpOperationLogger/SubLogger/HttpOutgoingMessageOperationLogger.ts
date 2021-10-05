// DO NOT INSTRUMENT

import {OutgoingMessage} from 'http';
import {BufferLogStore} from '../../../LogStore/BufferLogStore';
import {SocketLogStore} from '../../../LogStore/SocketLogStore';
import {Analysis, Hooks, Sandbox} from '../../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike, shouldBeVerbose} from '../../../Util';
export class HttpOutgoingMessageOperationLogger extends Analysis
{
    public invokeFunPre: Hooks['invokeFunPre'] | undefined;
    public endExecution: Hooks['endExecution'] | undefined;

    private timeConsumed: number;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.timeConsumed = 0;

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.invokeFunPre = (iid, f, base, args) =>
        {
            const startTimestamp = Date.now();

            if (base instanceof OutgoingMessage)
            {
                if (f === OutgoingMessage.prototype.destroy)
                {
                    const socket = base.socket;
                    if (socket !== null)
                    {
                        SocketLogStore.appendSocketOperation(socket, 'write', this.getSandbox(), iid);
                    }
                }
                else if (f === OutgoingMessage.prototype.write
                    || f === OutgoingMessage.prototype.end)
                {
                    const socket = base.socket;
                    if(socket !== null)
                    {
                        SocketLogStore.appendSocketOperation(socket, 'read', this.getSandbox(), iid);
                    }

                    const [chunk] = args as Parameters<typeof OutgoingMessage.prototype.write
                        | typeof OutgoingMessage.prototype.end>;
                    if (isBufferLike(chunk))
                    {
                        BufferLogStore.appendBufferOperation(chunk, 'read',
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