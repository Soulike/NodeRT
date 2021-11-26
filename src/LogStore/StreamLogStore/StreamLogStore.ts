// DO NOT INSTRUMENT

import {Readable, Writable} from 'stream';
import {Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid} from '../../Util';
import {AsyncContextLogStore} from '../AsyncContextLogStore';
import {StreamDeclaration} from './Class/StreamDeclaration';
import {StreamOperation} from './Class/StreamOperation';
import asyncHooks from 'async_hooks';
import {CallStackLogStore} from '../CallStackLogStore';
import {SourceCodeInfo} from '../Class/SourceCodeInfo';

export class StreamLogStore
{
    private static readonly streamToStreamDeclarations: WeakMap<Readable | Writable, StreamDeclaration> = new WeakMap();
    private static readonly streamDeclarations: StreamDeclaration[] = [];

    public static getStreamDeclarations(): ReadonlyArray<StreamDeclaration>
    {
        return StreamLogStore.streamDeclarations;
    }

    public static appendStreamOperation(stream: Readable | Writable, type: 'read' | 'write', operationKind: StreamOperation['operationKind'], sandbox: Sandbox, iid: number)
    {
        const streamDeclaration = StreamLogStore.getStreamDeclaration(stream, getSourceCodeInfoFromIid(iid, sandbox));
        const asyncContext = AsyncContextLogStore.getAsyncContextFromAsyncId(asyncHooks.executionAsyncId());
        if (type === 'write')
        {
            asyncContext.setHasWriteOperation(streamDeclaration);
        }
        streamDeclaration.appendOperation(asyncContext,
            new StreamOperation(type, operationKind, CallStackLogStore.getCallStack(), getSourceCodeInfoFromIid(iid, sandbox)));
    }

    private static getStreamDeclaration(stream: Readable | Writable, sourceCodeInfo: SourceCodeInfo | null)
    {
        const streamDeclaration = StreamLogStore.streamToStreamDeclarations.get(stream);
        if (streamDeclaration === undefined)
        {
            const newStreamDeclaration = new StreamDeclaration(stream, sourceCodeInfo);
            StreamLogStore.streamDeclarations.push(newStreamDeclaration);
            StreamLogStore.streamToStreamDeclarations.set(stream, newStreamDeclaration);
            return newStreamDeclaration;
        }
        else
        {
            return streamDeclaration;
        }
    }
}