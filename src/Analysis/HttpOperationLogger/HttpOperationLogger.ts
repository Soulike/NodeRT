// DO NOT INSTRUMENT

import http from 'http';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {SocketLogStore} from '../../LogStore/SocketLogStore';
import {StreamLogStore} from '../../LogStore/StreamLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike} from '../../Util';
import {HttpAgentOperationLogger} from './SubLogger/HttpAgentOperationLogger';
import {HttpIncomingMessageOperationLogger} from './SubLogger/HttpIncomingMessageOperationLogger';
import {HttpOutgoingMessageOperationLogger} from './SubLogger/HttpOutgoingMessageOperationLogger';

export class HttpOperationLogger extends Analysis
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
        // We only care about operations on underlying socket
        this.invokeFun = (iid, f, _base, _args, result) =>
        {
            const startTimestamp = Date.now();

            if (f === http.request || f === http.get)
            {
                const clientRequest = result as ReturnType<typeof http.request | typeof http.get>;
                StreamLogStore.appendStreamOperation(clientRequest, 'write', this.getSandbox(), iid);

                clientRequest.on('socket', socket =>
                {
                    SocketLogStore.appendSocketOperation(socket, 'write', this.getSandbox(), iid);
                    socket.on('data', (data) =>
                    {
                        if (isBufferLike(data))
                        {
                            BufferLogStore.appendBufferOperation(data, 'write',
                                getSourceCodeInfoFromIid(iid, this.getSandbox()));
                        }
                    });
                });
            }
            else if (f === http.createServer)
            {
                const server = result as ReturnType<typeof http.createServer>;

                server.on('connection', socket =>
                {
                    SocketLogStore.appendSocketOperation(socket, 'write', this.getSandbox(), iid);
                    socket.on('data', (data) =>
                    {
                        if (isBufferLike(data))
                        {
                            BufferLogStore.appendBufferOperation(data, 'write',
                                getSourceCodeInfoFromIid(iid, this.getSandbox()));
                        }
                    });
                });

                server.on('request', (req, res) =>
                {
                    StreamLogStore.appendStreamOperation(req, 'write', this.getSandbox(), iid);
                    StreamLogStore.appendStreamOperation(res, 'write', this.getSandbox(), iid);
                });
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            console.log(`Http: ${this.timeConsumed / 1000}s`);
        };

        const sandbox = this.getSandbox();
        sandbox.addAnalysis(new HttpAgentOperationLogger(sandbox));
        sandbox.addAnalysis(new HttpIncomingMessageOperationLogger(sandbox));
        sandbox.addAnalysis(new HttpOutgoingMessageOperationLogger(sandbox));
    }
}