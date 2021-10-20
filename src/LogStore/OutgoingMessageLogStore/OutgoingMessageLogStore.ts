// DO NOT INSTRUMENT

import {OutgoingMessageDeclaration} from './Class/OutgoingMessageDeclaration';
import {Sandbox} from '../../Type/nodeprof';
import {AsyncContextLogStore} from '../AsyncContextLogStore';
import {OutgoingMessageOperation} from './Class/OutgoingMessageOperation';
import {getSourceCodeInfoFromIid, parseErrorStackTrace} from '../../Util';
import asyncHooks from 'async_hooks';
import http from 'http';

export class OutgoingMessageLogStore
{
    private static readonly outgoingMessageToOutgoingMessageDeclarations: WeakMap<http.OutgoingMessage, OutgoingMessageDeclaration> = new WeakMap();
    private static readonly outgoingMessageDeclarations: OutgoingMessageDeclaration[] = [];

    public static getOutgoingMessageDeclarations(): ReadonlyArray<OutgoingMessageDeclaration>
    {
        return OutgoingMessageLogStore.outgoingMessageDeclarations;
    }

    /**
     * If an action changes the internal state of the outgoingMessage (e.g. destroy(), end()), we say that the action does a 'write' operation.
     * If an action uses the outgoingMessage (e.g. write()), we say that the action does a 'read' operation
     */
    public static appendOutgoingMessageOperation(outgoingMessage: http.OutgoingMessage, type: 'read' | 'write', operationKind: OutgoingMessageOperation['operationKind'], sandbox: Sandbox, iid: number)
    {
        const outgoingMessageDeclaration = OutgoingMessageLogStore.getOutgoingMessageDeclaration(outgoingMessage);
        const asyncContext = AsyncContextLogStore.getAsyncContextFromAsyncId(asyncHooks.executionAsyncId());
        if (type === 'write')
        {
            asyncContext.setHasWriteOperation(outgoingMessageDeclaration);
        }
        outgoingMessageDeclaration.appendOperation(asyncContext,
            new OutgoingMessageOperation(type, operationKind, parseErrorStackTrace(new Error().stack), getSourceCodeInfoFromIid(iid, sandbox)));
    }

    private static getOutgoingMessageDeclaration(outgoingMessage: http.OutgoingMessage)
    {
        const outgoingMessageDeclaration = OutgoingMessageLogStore.outgoingMessageToOutgoingMessageDeclarations.get(outgoingMessage);
        if (outgoingMessageDeclaration === undefined)
        {
            const newOutgoingMessageDeclaration = new OutgoingMessageDeclaration(outgoingMessage);
            OutgoingMessageLogStore.outgoingMessageDeclarations.push(newOutgoingMessageDeclaration);
            OutgoingMessageLogStore.outgoingMessageToOutgoingMessageDeclarations.set(outgoingMessage, newOutgoingMessageDeclaration);
            return newOutgoingMessageDeclaration;
        }
        else
        {
            return outgoingMessageDeclaration;
        }
    }
}