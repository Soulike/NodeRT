// DO NOT INSTRUMENT

import {BufferDeclaration} from './Class/BufferDeclaration';
import {BufferLike} from '../../Analysis/Type/BufferLike';
import util from 'util';
import {ArrayBufferLike} from '../../Analysis/Type/ArrayBufferLike';
import {Sandbox} from '../../Type/nodeprof';
import {AsyncContextLogStore} from '../AsyncContextLogStore';
import {BufferOperation} from './Class/BufferOperation';
import {getSourceCodeInfoFromIid} from '../../Util';
import {SourceCodeInfo} from '../Class/SourceCodeInfo';
import {strict as assert} from 'assert';
import asyncHooks from 'async_hooks';
import {CallStackLogStore} from '../CallStackLogStore';

// Since buffer is used in many modules, we need to log its declarations in a shared object
export class BufferLogStore
{
    private static bufferToBufferDeclaration: WeakMap<ArrayBufferLike, BufferDeclaration> = new WeakMap();
    private static bufferDeclarations: BufferDeclaration[] = [];

    public static getBufferDeclaration(buffer: BufferLike, sourceCodeInfo: SourceCodeInfo)
    {
        const underArrayBuffer = util.types.isAnyArrayBuffer(buffer) ? buffer : buffer.buffer;
        const bufferDeclaration = BufferLogStore.bufferToBufferDeclaration.get(underArrayBuffer);
        if (bufferDeclaration === undefined)
        {
            const newBufferDeclaration = new BufferDeclaration(underArrayBuffer, sourceCodeInfo);
            BufferLogStore.bufferDeclarations.push(newBufferDeclaration);
            BufferLogStore.bufferToBufferDeclaration.set(underArrayBuffer, newBufferDeclaration);
            return newBufferDeclaration;
        }
        else
        {
            return bufferDeclaration;
        }
    }

    public static getBufferDeclarations(): ReadonlyArray<BufferDeclaration>
    {
        return BufferLogStore.bufferDeclarations;
    }

    public static appendBufferOperation(buffer: BufferLike, type: 'read' | 'write', accessStage: BufferOperation['accessStage'], sourceCodeInfo: SourceCodeInfo): void;
    public static appendBufferOperation(buffer: BufferLike, type: 'read' | 'write', accessStage: BufferOperation['accessStage'], sandbox: Sandbox, iid: number): void;
    public static appendBufferOperation(buffer: BufferLike, type: 'read' | 'write', accessStage: BufferOperation['accessStage'], sandboxOrSourceCodeInfo: Sandbox | SourceCodeInfo, iid?: number): void
    {
        let bufferDeclaration: BufferDeclaration;
        if (sandboxOrSourceCodeInfo instanceof SourceCodeInfo)
        {
            bufferDeclaration = BufferLogStore.getBufferDeclaration(buffer, sandboxOrSourceCodeInfo);
        }
        else
        {
            assert.ok(iid !== undefined);
            bufferDeclaration = BufferLogStore.getBufferDeclaration(buffer, getSourceCodeInfoFromIid(iid, sandboxOrSourceCodeInfo));
        }

        const asyncContext = AsyncContextLogStore.getAsyncContextFromAsyncId(asyncHooks.executionAsyncId());
        if (type === 'write')
        {
            asyncContext.setHasWriteOperation(bufferDeclaration);
        }
        if (sandboxOrSourceCodeInfo instanceof SourceCodeInfo)
        {
            bufferDeclaration.appendOperation(asyncContext,
                new BufferOperation(type, accessStage, CallStackLogStore.getCallStack(), sandboxOrSourceCodeInfo));
        }
        else    // sandbox
        {
            assert.ok(iid !== undefined);
            bufferDeclaration.appendOperation(asyncContext,
                new BufferOperation(type, accessStage, CallStackLogStore.getCallStack(), getSourceCodeInfoFromIid(iid, sandboxOrSourceCodeInfo)));
        }
    }
}