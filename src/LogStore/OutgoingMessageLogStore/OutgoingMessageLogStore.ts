// DO NOT INSTRUMENT

import asyncHooks from 'async_hooks';
import http from 'http';
import {Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid} from '../../Util';
import {AsyncContextLogStore} from '../AsyncContextLogStore';
import {CallStackLogStore} from '../CallStackLogStore';
import {SourceCodeInfo} from '../Class/SourceCodeInfo';
import {OutgoingMessageDeclaration} from './Class/OutgoingMessageDeclaration';
import {OutgoingMessageOperation} from './Class/OutgoingMessageOperation';

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
        const outgoingMessageDeclaration = OutgoingMessageLogStore.getOutgoingMessageDeclaration(outgoingMessage, getSourceCodeInfoFromIid(iid, sandbox));
        const asyncContext = AsyncContextLogStore.getAsyncContextFromAsyncId(asyncHooks.executionAsyncId());
        if (type === 'write')
        {
            asyncContext.setHasWriteOperation(outgoingMessageDeclaration);
        }
        outgoingMessageDeclaration.appendOperation(asyncContext,
            new OutgoingMessageOperation(type, operationKind, CallStackLogStore.getCallStack(), getSourceCodeInfoFromIid(iid, sandbox)));
    }

    private static getOutgoingMessageDeclaration(outgoingMessage: http.OutgoingMessage, sourceCodeInfo: SourceCodeInfo | null)
    {
        const outgoingMessageDeclaration = OutgoingMessageLogStore.outgoingMessageToOutgoingMessageDeclarations.get(outgoingMessage);
        if (outgoingMessageDeclaration === undefined)
        {
            const newOutgoingMessageDeclaration = new OutgoingMessageDeclaration(outgoingMessage, sourceCodeInfo);
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