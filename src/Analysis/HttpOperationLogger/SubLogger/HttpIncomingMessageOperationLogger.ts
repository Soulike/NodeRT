// DO NOT INSTRUMENT

import {IncomingMessage} from 'http';
import {SocketLogStore} from '../../../LogStore/SocketLogStore';
import {Analysis, Hooks, Sandbox} from '../../../Type/nodeprof';

export class HttpIncomingMessageOperationLogger extends Analysis
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
        this.invokeFunPre = (iid, f, base) =>
        {
            const startTimestamp = Date.now();

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

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            console.log(`HttpIncomingMessage: ${this.timeConsumed / 1000}s`);
        };
    }
}