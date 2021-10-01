// DO NOT INSTRUMENT

import {Readable, Writable} from 'stream';
import {Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, parseErrorStackTrace} from '../../Util';
import {AsyncContextLogStore} from '../AsyncContextLogStore';
import {StreamDeclaration} from './Class/StreamDeclaration';
import {StreamOperation} from './Class/StreamOperation';
import asyncHooks from 'async_hooks';

export class StreamLogStore
{
    private static readonly streamToStreamDeclarations: WeakMap<Readable | Writable, StreamDeclaration> = new WeakMap();
    private static readonly streamDeclarations: StreamDeclaration[] = [];

    public static getStreamDeclarations(): ReadonlyArray<StreamDeclaration>
    {
        return StreamLogStore.streamDeclarations;
    }

    public static appendStreamOperation(stream: Readable | Writable, type: 'read' | 'write', sandbox: Sandbox, iid: number)
    {
        const streamDeclaration = StreamLogStore.getStreamDeclaration(stream);
        const callbackFunction = AsyncContextLogStore.getFunctionCallFromAsyncId(asyncHooks.executionAsyncId());
        if (type === 'write')
        {
            callbackFunction.setHasWriteOperation();
        }
        streamDeclaration.appendOperation(callbackFunction,
            new StreamOperation(type, parseErrorStackTrace(new Error().stack), getSourceCodeInfoFromIid(iid, sandbox)));
    }

    private static getStreamDeclaration(stream: Readable | Writable)
    {
        const streamDeclaration = StreamLogStore.streamToStreamDeclarations.get(stream);
        if (streamDeclaration === undefined)
        {
            const newStreamDeclaration = new StreamDeclaration(stream);
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