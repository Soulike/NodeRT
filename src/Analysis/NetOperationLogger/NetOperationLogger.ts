// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import net from 'net';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {SocketLogStore} from '../../LogStore/SocketLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike} from '../../Util';

export class NetOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks()
    {
        // We only care about operations on underlying socket;
        this.invokeFun = (iid, f, base, args, result) =>
        {
            if (f === net.createServer)
            {
                const server = result as ReturnType<typeof net.createServer>;

                server.on('connection', (socket) =>
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
            else if (f === net.createConnection
                || f === net.connect
                || f === net.Socket)
            {
                const socket = result as ReturnType<typeof net.createConnection>;
                SocketLogStore.appendSocketOperation(socket, this.getSandbox(), iid);
                socket.on('data', (data) =>
                {
                    if (isBufferLike(data))
                    {
                        BufferLogStore.appendBufferOperation(data, 'write',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                });
            }
            else if (f === net.Socket.prototype.connect
                || f === net.Socket.prototype.pause
                || f === net.Socket.prototype.resume
                || f === net.Socket.prototype.destroy)
            {
                assert.ok(base instanceof net.Socket);
                const socket = base;
                SocketLogStore.appendSocketOperation(socket, this.getSandbox(), iid);
            }
            else if (f === net.Socket.prototype.end
                || f === net.Socket.prototype.write)
            {
                if (isBufferLike(args[0]))
                {
                    BufferLogStore.appendBufferOperation(args[0], 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
        };
    }
}