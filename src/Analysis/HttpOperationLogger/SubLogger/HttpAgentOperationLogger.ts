// DO NOT INSTRUMENT

import {Agent} from 'http';
import {SocketLogStore} from '../../../LogStore/SocketLogStore';
import {Analysis, Hooks, Sandbox} from '../../../Type/nodeprof';
import {shouldBeVerbose} from '../../../Util';

export class HttpAgentOperationLogger extends Analysis
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

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, base) =>
        {
            const startTimestamp = Date.now();

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

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`HttpAgent: ${this.timeConsumed / 1000}s`);
            }
        };
    }
}