// DO NOT INSTRUMENT

import {Agent} from 'http';
import {SocketLogStore} from '../../../LogStore/SocketLogStore';
import {Analysis, Hooks, Sandbox} from '../../../Type/nodeprof';

export class HttpAgentOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, base) =>
        {
            if (base instanceof Agent)
            {
                if (f === Agent.prototype.destroy)
                {
                    const sockets = Object.values(base.sockets).flat();
                    for (const socket of sockets)
                    {
                        if (socket !== undefined)
                        {
                            SocketLogStore.appendSocketOperation(socket, 'write', this.getSandbox(), iid);
                        }
                    }
                }
            }
        };
    }
}