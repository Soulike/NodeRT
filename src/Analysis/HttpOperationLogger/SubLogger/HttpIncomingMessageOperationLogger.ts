// DO NOT INSTRUMENT

import {IncomingMessage} from 'http';
import {SocketLogStore} from '../../../LogStore/SocketLogStore';
import {Analysis, Hooks, Sandbox} from '../../../Type/nodeprof';

export class HttpIncomingMessageOperationLogger extends Analysis
{
    public invokeFunPre: Hooks['invokeFunPre'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.invokeFunPre = (iid, f, base) =>
        {
            if (base instanceof IncomingMessage)
            {
                if (f === IncomingMessage.prototype.destroy)
                {
                    const socket = base.socket;
                    if (socket !== null)
                    {
                        SocketLogStore.appendSocketOperation(socket, 'write', this.getSandbox(), iid);
                    }
                }
            }
        };
    }
}