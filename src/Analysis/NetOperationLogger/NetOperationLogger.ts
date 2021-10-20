// DO NOT INSTRUMENT

import net from 'net';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {SocketLogStore} from '../../LogStore/SocketLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike, shouldBeVerbose} from '../../Util';

export class NetOperationLogger extends Analysis
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
        // We only care about operations on underlying socket;
        this.invokeFun = (iid, f, base, args, result) =>
        {
            const startTimestamp = Date.now();

            if (f === net.createServer)
            {
                const server = result as ReturnType<typeof net.createServer>;

                server.on('connection', (socket) =>
                {
                    SocketLogStore.appendSocketOperation(socket, 'write', 'construct', this.getSandbox(), iid);
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
                SocketLogStore.appendSocketOperation(socket, 'write', 'construct', this.getSandbox(), iid);
                socket.on('data', (data) =>
                {
                    if (isBufferLike(data))
                    {
                        BufferLogStore.appendBufferOperation(data, 'write',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                });
            }
            else if (base instanceof net.Socket)
            {
                if (f === net.Socket.prototype.connect)
                {
                    const socket = base;
                    SocketLogStore.appendSocketOperation(socket, 'write', 'construct', this.getSandbox(), iid);
                }
                else if (f === net.Socket.prototype.pause)
                {
                    const socket = base;
                    SocketLogStore.appendSocketOperation(socket, 'write', 'pause', this.getSandbox(), iid);
                }
                else if (f === net.Socket.prototype.resume)
                {
                    const socket = base;
                    SocketLogStore.appendSocketOperation(socket, 'write', 'resume', this.getSandbox(), iid);
                }
                else if (f === net.Socket.prototype.destroy)
                {
                    const socket = base;
                    SocketLogStore.appendSocketOperation(socket, 'write', 'destroy', this.getSandbox(), iid);
                }
                else if (f === net.Socket.prototype.write)
                {
                    const socket = base;
                    SocketLogStore.appendSocketOperation(socket, 'read', 'write', this.getSandbox(), iid);
                    if (isBufferLike(args[0]))
                    {
                        BufferLogStore.appendBufferOperation(args[0], 'read',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                }
                else if (f === net.Socket.prototype.end)
                {
                    const socket = base;
                    SocketLogStore.appendSocketOperation(socket, 'write', 'end', this.getSandbox(), iid);
                    if (isBufferLike(args[0]))
                    {
                        BufferLogStore.appendBufferOperation(args[0], 'read',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`Net: ${this.timeConsumed / 1000}s`);
            }
        };
    }
}