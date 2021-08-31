// DO NOT INSTRUMENT

import dgram from 'dgram';
import net from 'net';
import {SocketDeclaration} from './Class/SocketDeclaration';
import {Sandbox} from '../../Type/nodeprof';
import {AsyncContextLogStore} from '../AsyncContextLogStore';
import {SocketOperation} from './Class/SocketOperation';
import {getSourceCodeInfoFromIid} from '../../Util';
import {StreamLogStore} from '../StreamLogStore';
import asyncHooks from 'async_hooks';

export class SocketLogStore
{
    private static readonly socketToSocketDeclarations: WeakMap<dgram.Socket | net.Socket, SocketDeclaration> = new WeakMap();
    private static readonly socketDeclarations: SocketDeclaration[] = [];

    public static getSocketDeclarations(): ReadonlyArray<SocketDeclaration>
    {
        return SocketLogStore.socketDeclarations;
    }

    public static appendSocketOperation(socket: dgram.Socket | net.Socket, sandbox: Sandbox, iid: number)
    {
        const socketDeclaration = SocketLogStore.getSocketDeclaration(socket, sandbox, iid);
        socketDeclaration.appendOperation(AsyncContextLogStore.getFunctionCallFromAsyncId(asyncHooks.executionAsyncId()),
            new SocketOperation(getSourceCodeInfoFromIid(iid, sandbox)));
    }

    private static getSocketDeclaration(socket: dgram.Socket | net.Socket, sandbox: Sandbox, iid: number)
    {
        const socketDeclaration = SocketLogStore.socketToSocketDeclarations.get(socket);
        if (socketDeclaration === undefined)
        {
            if (socket instanceof net.Socket)    // net.Socket inherits Stream, so a creation of a socket is a creation of a stream
            {
                StreamLogStore.appendStreamOperation(socket, 'write', sandbox, iid);
            }
            
            const newSocketDeclaration = new SocketDeclaration(socket);
            SocketLogStore.socketDeclarations.push(newSocketDeclaration);
            SocketLogStore.socketToSocketDeclarations.set(socket, newSocketDeclaration);
            return newSocketDeclaration;
        }
        else
        {
            return socketDeclaration;
        }
    }
}