// DO NOT INSTRUMENT

import net from 'net';
import {SocketDeclaration} from './Class/SocketDeclaration';
import {Sandbox} from '../../Type/nodeprof';
import {AsyncContextLogStore} from '../AsyncContextLogStore';
import {SocketOperation} from './Class/SocketOperation';
import {getSourceCodeInfoFromIid, parseErrorStackTrace} from '../../Util';
import {StreamLogStore} from '../StreamLogStore';
import asyncHooks from 'async_hooks';

export class SocketLogStore
{
    private static readonly socketToSocketDeclarations: WeakMap<net.Socket, SocketDeclaration> = new WeakMap();
    private static readonly socketDeclarations: SocketDeclaration[] = [];

    public static getSocketDeclarations(): ReadonlyArray<SocketDeclaration>
    {
        return SocketLogStore.socketDeclarations;
    }

    /**
     * If an action changes the internal state of the socket (e.g. destroy(), end()), we say that the action does a 'write' operation.
     * If an action uses the socket (e.g. write()), we say that the action does a 'read' operation
     */
    public static appendSocketOperation(socket: net.Socket, type: 'read' | 'write', operationKind: SocketOperation['operationKind'], sandbox: Sandbox, iid: number)
    {
        const socketDeclaration = SocketLogStore.getSocketDeclaration(socket, type, operationKind, sandbox, iid);
        const asyncContext = AsyncContextLogStore.getAsyncContextFromAsyncId(asyncHooks.executionAsyncId());
        if (type === 'write')
        {
            asyncContext.setHasWriteOperation(socketDeclaration);
        }
        socketDeclaration.appendOperation(asyncContext,
            new SocketOperation(type, operationKind, parseErrorStackTrace(new Error().stack), getSourceCodeInfoFromIid(iid, sandbox)));
    }

    private static getSocketDeclaration(socket: net.Socket, type: 'read' | 'write', operationKind: SocketOperation['operationKind'], sandbox: Sandbox, iid: number)
    {
        const socketDeclaration = SocketLogStore.socketToSocketDeclarations.get(socket);
        if (socketDeclaration === undefined)
        {
            if (socket instanceof net.Socket && operationKind === 'construction')    // net.Socket inherits Stream, so a creation of a socket is a creation of a stream
            {
                StreamLogStore.appendStreamOperation(socket, type, operationKind, sandbox, iid);
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