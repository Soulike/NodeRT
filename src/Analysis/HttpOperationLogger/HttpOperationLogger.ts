// DO NOT INSTRUMENT

import http from 'http';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {CallStackLogStore} from '../../LogStore/CallStackLogStore';
import {OutgoingMessageLogStore} from '../../LogStore/OutgoingMessageLogStore';
import {SocketLogStore} from '../../LogStore/SocketLogStore';
import {StreamLogStore} from '../../LogStore/StreamLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike, shouldBeVerbose} from '../../Util';
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
                StreamLogStore.appendStreamOperation(clientRequest, 'write', 'construction', this.getSandbox(), iid);
                OutgoingMessageLogStore.appendOutgoingMessageOperation(clientRequest, 'write', 'construction',
                    this.getSandbox(), iid);

                clientRequest.on('socket', socket =>
                {
                    SocketLogStore.appendSocketOperation(socket, 'read', 'HTTP', this.getSandbox(), iid);
                    socket.on('data', (data) =>
                    {
                        if (isBufferLike(data))
                        {
                            BufferLogStore.appendBufferOperation(data, 'write', 'finish',
                                getSourceCodeInfoFromIid(CallStackLogStore.getTopIid(), this.getSandbox()));
                        }
                    });
                });
            }
            else if (f === http.createServer)
            {
                const server = result as ReturnType<typeof http.createServer>;

                server.on('connection', socket =>
                {
                    SocketLogStore.appendSocketOperation(socket, 'read', 'HTTP', this.getSandbox(), iid);
                    socket.on('data', (data) =>
                    {
                        if (isBufferLike(data))
                        {
                            BufferLogStore.appendBufferOperation(data, 'write', 'finish',
                                getSourceCodeInfoFromIid(CallStackLogStore.getTopIid(), this.getSandbox()));
                        }
                    });
                });

                server.on('request', (req, res) =>
                {
                    StreamLogStore.appendStreamOperation(req, 'write', 'construction', this.getSandbox(), CallStackLogStore.getTopIid());
                    StreamLogStore.appendStreamOperation(res, 'write', 'construction', this.getSandbox(), CallStackLogStore.getTopIid());
                });
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`Http: ${this.timeConsumed / 1000}s`);
            }
        };

        const sandbox = this.getSandbox();
        sandbox.addAnalysis(new HttpAgentOperationLogger(sandbox));
        sandbox.addAnalysis(new HttpIncomingMessageOperationLogger(sandbox));
        sandbox.addAnalysis(new HttpOutgoingMessageOperationLogger(sandbox));
    }
}