// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import dgram from 'dgram';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {getSourceCodeInfoFromIid, isBufferLike} from '../../Util';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {isObject} from 'lodash';
import {SocketLogStore} from '../../LogStore/SocketLogStore';

export class DgramOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks(): void
    {
        this.invokeFun = (iid, f, base, args, result) =>
        {
            if (f === dgram.createSocket)
            {
                const socket = result as ReturnType<typeof dgram.createSocket>;
                socket.on('message', (msg) =>
                {
                    BufferLogStore.appendBufferOperation(msg, 'write',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                });
                SocketLogStore.appendSocketOperation(socket, this.getSandbox(), iid);
            }
            else if (base instanceof dgram.Socket)
            {
                // change the internal state of the socket, seen as write operation
                if (f === dgram.Socket.prototype.bind
                    || f === dgram.Socket.prototype.close
                    || f === dgram.Socket.prototype.connect
                    || f === dgram.Socket.prototype.disconnect)
                {
                    SocketLogStore.appendSocketOperation(base, this.getSandbox(), iid);
                }
                else if (f === dgram.Socket.prototype.send)
                {
                    const [msg] = args as Parameters<typeof dgram.Socket.prototype.send>;
                    if (isBufferLike(msg))
                    {
                        BufferLogStore.appendBufferOperation(msg, 'read',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                    else if (isObject(msg))
                    {
                        ObjectLogStore.appendObjectOperation(msg, 'read',null, this.getSandbox(), iid);
                    }
                }
            }
        };
    }
}