// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import dgram from 'dgram';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {getSourceCodeInfoFromIid, isBufferLike} from '../../Util';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {strict as assert} from 'assert';
import {isObject} from 'lodash';

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
                ObjectLogStore.appendObjectOperation(socket, 'write', this.getSandbox(), iid);
            }
            // change the internal state of the socket, seen as write operation
            else if (f === dgram.Socket.bind
                || f === dgram.Socket.prototype.close
                || f === dgram.Socket.prototype.connect
                || f === dgram.Socket.prototype.disconnect)
            {
                assert.ok(base instanceof dgram.Socket);
                ObjectLogStore.appendObjectOperation(base, 'write', this.getSandbox(), iid);
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
                    ObjectLogStore.appendObjectOperation(msg, 'read', this.getSandbox(), iid);
                }
            }
        };
    }
}