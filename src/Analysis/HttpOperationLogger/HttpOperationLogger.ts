// DO NOT INSTRUMENT

import http from 'http';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike} from '../../Util';

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
        this.invokeFun = (iid, f, _base, args, result) =>
        {
            if (f === http.request || f === http.get)
            {
                const clientRequest = result as ReturnType<typeof http.request>;

                clientRequest.on('socket', socket =>
                {
                    ObjectLogStore.appendObjectOperation(socket, 'write', this.getSandbox(), iid);
                    socket.on('close', () =>
                    {
                        ObjectLogStore.appendObjectOperation(socket, 'write', this.getSandbox(), iid);
                    });
                });

                clientRequest.on('connect', (_response, _socket, head) =>
                {
                    BufferLogStore.appendBufferOperation(head, 'write',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                });

                clientRequest.on('upgrade', (_response, _socket, head) =>
                {
                    BufferLogStore.appendBufferOperation(head, 'write',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                });
            }
            else if (f === http.createServer)
            {
                const server = result as ReturnType<typeof http.createServer>;

                server.on('connection', socket =>
                {
                    ObjectLogStore.appendObjectOperation(socket, 'write', this.getSandbox(), iid);
                    socket.on('close', () =>
                    {
                        ObjectLogStore.appendObjectOperation(socket, 'write', this.getSandbox(), iid);
                    });
                });

                server.on('connect', (_req, _socket, head) =>
                {
                    BufferLogStore.appendBufferOperation(head, 'write',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                });

                server.on('upgrade', (_req, _socket, head) =>
                {
                    BufferLogStore.appendBufferOperation(head, 'write',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                });
            }
            else if (f === http.OutgoingMessage.prototype.end
                || f === http.OutgoingMessage.prototype.write)
            {
                const [chunk] = args as Parameters<typeof http.OutgoingMessage.prototype.write>;
                if (isBufferLike(chunk))
                {
                    BufferLogStore.appendBufferOperation(chunk, 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
        };
    }
}