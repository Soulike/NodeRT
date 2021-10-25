// DO NOT INSTRUMENT

import dgram from 'dgram';
import {isObject} from 'lodash';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {SocketLogStore} from '../../LogStore/SocketLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike, shouldBeVerbose} from '../../Util';

export class DgramOperationLogger extends Analysis
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
        this.invokeFun = (iid, f, base, args, result) =>
        {
            const startTimestamp = Date.now();

            if (f === dgram.createSocket)
            {
                const socket = result as ReturnType<typeof dgram.createSocket>;
                socket.on('message', (msg) =>
                {
                    BufferLogStore.appendBufferOperation(msg, 'write',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                });
                SocketLogStore.appendSocketOperation(socket, 'write', 'construct', this.getSandbox(), iid);
            }
            else if (base instanceof dgram.Socket)
            {
                // change the internal state of the socket, seen as write operation
                if (f === dgram.Socket.prototype.bind
                    || f === dgram.Socket.prototype.connect)
                {
                    SocketLogStore.appendSocketOperation(base, 'write', 'construct', this.getSandbox(), iid);
                }
                if (f === dgram.Socket.prototype.close
                    || f === dgram.Socket.prototype.disconnect)
                {
                    SocketLogStore.appendSocketOperation(base, 'write', 'destroy', this.getSandbox(), iid);
                }
                else if (f === dgram.Socket.prototype.send)
                {
                    SocketLogStore.appendSocketOperation(base, 'read', 'write', this.getSandbox(), iid);
                    const [msg] = args as Parameters<typeof dgram.Socket.prototype.send>;
                    if (isBufferLike(msg))
                    {
                        BufferLogStore.appendBufferOperation(msg, 'read',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                    else if (isObject(msg))
                    {
                        ObjectLogStore.appendObjectOperation(msg, 'read', null, this.getSandbox(), iid);
                    }
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`Dgram: ${this.timeConsumed / 1000}s`);
            }
        };
    }
}