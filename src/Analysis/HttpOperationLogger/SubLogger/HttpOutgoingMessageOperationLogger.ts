// DO NOT INSTRUMENT

import {OutgoingMessage} from 'http';
import {BufferLogStore} from '../../../LogStore/BufferLogStore';
import {SocketLogStore} from '../../../LogStore/SocketLogStore';
import {Analysis, Hooks, Sandbox} from '../../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike} from '../../../Util';

export class HttpOutgoingMessageOperationLogger extends Analysis
{
    public invokeFunPre: Hooks['invokeFunPre'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.invokeFunPre = (iid, f, base, args) =>
        {
            if (base instanceof OutgoingMessage)
            {
                if (f === OutgoingMessage.prototype.destroy)
                {
                    const socket = base.socket;
                    if (socket !== null)
                    {
                        SocketLogStore.appendSocketOperation(socket, this.getSandbox(), iid);
                    }
                }
                else if (f === OutgoingMessage.prototype.write
                    || f === OutgoingMessage.prototype.end)
                {
                    const [chunk] = args as Parameters<typeof OutgoingMessage.prototype.write
                        | typeof OutgoingMessage.prototype.end>;
                    if (isBufferLike(chunk))
                    {
                        BufferLogStore.appendBufferOperation(chunk, 'read',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                }
            }
        };
    }
}