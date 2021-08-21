// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import http from 'http';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike} from '../../Util';

export class HttpOperationLogger extends Analysis
{
    public invokeFunPre: Hooks['invokeFunPre'] | undefined;
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
                ObjectLogStore.appendObjectOperation(clientRequest, 'write', this.getSandbox(), iid);

                clientRequest.on('socket', socket =>
                {
                    ObjectLogStore.appendObjectOperation(socket, 'write', this.getSandbox(), iid);
                });

                clientRequest.on('connect', (response, _socket, head) =>
                {
                    ObjectLogStore.appendObjectOperation(response, 'write', this.getSandbox(), iid);
                    BufferLogStore.appendBufferOperation(head, 'write',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                });

                clientRequest.on('upgrade', (response, _socket, head) =>
                {
                    ObjectLogStore.appendObjectOperation(response, 'write', this.getSandbox(), iid);
                    BufferLogStore.appendBufferOperation(head, 'write',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                });

                clientRequest.on('response', (response) =>
                {
                    ObjectLogStore.appendObjectOperation(response, 'write', this.getSandbox(), iid);
                });
            }
            else if (f === http.createServer)
            {
                const server = result as ReturnType<typeof http.createServer>;
                ObjectLogStore.appendObjectOperation(server, 'write', this.getSandbox(), iid);

                const requestHandler: http.RequestListener = (req, res) =>
                {
                    ObjectLogStore.appendObjectOperation(req, 'write', this.getSandbox(), iid);
                    ObjectLogStore.appendObjectOperation(res, 'write', this.getSandbox(), iid);
                    if (res.socket !== null)
                    {
                        ObjectLogStore.appendObjectOperation(res.socket, 'write', this.getSandbox(), iid);
                    }
                    res.on('close', () =>
                    {
                        if (res.socket !== null)
                        {
                            ObjectLogStore.appendObjectOperation(res.socket, 'write', this.getSandbox(), iid);
                        }
                    });
                };

                server.on('connection', socket =>
                {
                    ObjectLogStore.appendObjectOperation(socket, 'write', this.getSandbox(), iid);
                });

                server.on('checkContinue', requestHandler);

                server.on('checkExpectation', requestHandler);

                server.on('connect', (req, _socket, head) =>
                {
                    ObjectLogStore.appendObjectOperation(req, 'write', this.getSandbox(), iid);
                    BufferLogStore.appendBufferOperation(head, 'write',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                });

                server.on('request', requestHandler);

                server.on('upgrade', (req, _socket, head) =>
                {
                    ObjectLogStore.appendObjectOperation(req, 'write', this.getSandbox(), iid);
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

        this.invokeFunPre = (iid, f, base) =>
        {
            if (f === http.ClientRequest.prototype.abort
                || f === http.OutgoingMessage.prototype.destroy)
            {
                assert.ok(base instanceof http.OutgoingMessage);
                if (base.socket !== null)
                {
                    ObjectLogStore.appendObjectOperation(base.socket, 'write', this.getSandbox(), iid);
                }
            }
        };
    }
}