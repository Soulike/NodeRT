// DO NOT INSTRUMENT

import http from 'http';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {SocketLogStore} from '../../LogStore/SocketLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike} from '../../Util';
import {HttpAgentOperationLogger} from './SubLogger/HttpAgentOperationLogger';
import {HttpIncomingMessageOperationLogger} from './SubLogger/HttpIncomingMessageOperationLogger';
import {HttpOutgoingMessageOperationLogger} from './SubLogger/HttpOutgoingMessageOperationLogger';

export class HttpOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks(): void
    {
        // We only care about operations on underlying socket
        this.invokeFun = (iid, f, _base, _args, result) =>
        {
            if (f === http.request || f === http.get)
            {
                const clientRequest = result as ReturnType<typeof http.request | typeof http.get>;

                clientRequest.on('socket', socket =>
                {
                    SocketLogStore.appendSocketOperation(socket, this.getSandbox(), iid);
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
                    SocketLogStore.appendSocketOperation(socket, this.getSandbox(), iid);
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
        };

        const sandbox = this.getSandbox();
        sandbox.addAnalysis(new HttpAgentOperationLogger(sandbox));
        sandbox.addAnalysis(new HttpIncomingMessageOperationLogger(sandbox));
        sandbox.addAnalysis(new HttpOutgoingMessageOperationLogger(sandbox));
    }
}