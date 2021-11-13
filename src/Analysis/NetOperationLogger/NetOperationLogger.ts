// DO NOT INSTRUMENT

import net from 'net';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {CallStackLogStore} from '../../LogStore/CallStackLogStore';
import {SocketLogStore} from '../../LogStore/SocketLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike, shouldBeVerbose} from '../../Util';

export class NetOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public functionEnter: Hooks['functionEnter'] | undefined;
    public endExecution: Hooks['endExecution'] | undefined;

    private timeConsumed: number;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.timeConsumed = 0;

        this.doMonkeyPatch();
    }

    protected override doMonkeyPatch()
    {
        const loggerThis = this;

        const originalSocketWrite = net.Socket.prototype.write;
        net.Socket.prototype.write = function (...args: any[])
        {
            const startTimestamp = Date.now();
            SocketLogStore.appendSocketOperation(this, 'read', 'write', loggerThis.getSandbox(), CallStackLogStore.getTopIid());
            if (isBufferLike(args[0]))
            {
                BufferLogStore.appendBufferOperation(args[0], 'read', 'finish',
                    BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[0]),
                    getSourceCodeInfoFromIid(CallStackLogStore.getTopIid(), loggerThis.getSandbox()));
            }
            loggerThis.timeConsumed += Date.now() - startTimestamp;
            // @ts-ignore
            return originalSocketWrite.call(this, ...args);
        };

        const originalSocketEnd = net.Socket.prototype.end;
        net.Socket.prototype.end = function (...args: any[])
        {
            const startTimestamp = Date.now();
            SocketLogStore.appendSocketOperation(this, 'write', 'end', loggerThis.getSandbox(), CallStackLogStore.getTopIid());
            if (isBufferLike(args[0]))
            {
                BufferLogStore.appendBufferOperation(args[0], 'read', 'finish',
                    BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[0]),
                    getSourceCodeInfoFromIid(CallStackLogStore.getTopIid(), loggerThis.getSandbox()));
            }
            loggerThis.timeConsumed += Date.now() - startTimestamp;
            // @ts-ignore
            return originalSocketEnd.call(this, ...args);
        };

        const originalSocketDestroy = net.Socket.prototype.destroy;
        net.Socket.prototype.destroy = function (...args: any[])
        {
            const startTimestamp = Date.now();
            if (!this.destroyed)
            {
                SocketLogStore.appendSocketOperation(this, 'write', 'destroy', loggerThis.getSandbox(), CallStackLogStore.getTopIid());
            }
            loggerThis.timeConsumed += Date.now() - startTimestamp;
            // @ts-ignore
            return originalSocketDestroy.call(this, ...args);
        };

        const originalSocketConnect = net.Socket.prototype.connect;
        net.Socket.prototype.connect = function (...args: any[])
        {
            const startTimestamp = Date.now();
            SocketLogStore.appendSocketOperation(this, 'write', 'connection', loggerThis.getSandbox(), CallStackLogStore.getTopIid());
            loggerThis.timeConsumed += Date.now() - startTimestamp;
            // @ts-ignore
            return originalSocketConnect.call(this, ...args);
        };
    }

    protected override registerHooks()
    {
        // We only care about operations on underlying socket;
        this.invokeFun = (iid, f, _base, _args, result) =>
        {
            const startTimestamp = Date.now();

            if (f === net.createServer)
            {
                const server = result as ReturnType<typeof net.createServer>;

                server.on('connection', (socket) =>
                {
                    SocketLogStore.appendSocketOperation(socket, 'write', 'construction', this.getSandbox(), iid);
                    socket.on('data', (data) =>
                    {
                        if (isBufferLike(data))
                        {
                            BufferLogStore.appendBufferOperation(data, 'write', 'finish',
                                BufferLogStore.getArrayBufferRangeOfArrayBufferView(data),
                                getSourceCodeInfoFromIid(CallStackLogStore.getTopIid(), this.getSandbox()));
                        }
                    });
                });
            }
            else if (f === net.createConnection
                || f === net.connect
                || f === net.Socket)
            {
                const socket = result as ReturnType<typeof net.createConnection>;
                SocketLogStore.appendSocketOperation(socket, 'write', 'construction', this.getSandbox(), iid);
                socket.on('data', (data) =>
                {
                    if (isBufferLike(data))
                    {
                        BufferLogStore.appendBufferOperation(data, 'write', 'finish',
                            BufferLogStore.getArrayBufferRangeOfArrayBufferView(data),
                            getSourceCodeInfoFromIid(CallStackLogStore.getTopIid(), this.getSandbox()));
                    }
                });
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