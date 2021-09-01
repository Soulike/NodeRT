// DO NOT INSTRUMENT

import {BufferDeclaration} from './Class/BufferDeclaration';
import {BufferLike} from '../../Analysis/Type/BufferLike';
import util from 'util';
import {ArrayBufferLike} from '../../Analysis/Type/ArrayBufferLike';
import {Sandbox} from '../../Type/nodeprof';
import {AsyncContextLogStore} from '../AsyncContextLogStore';
import {BufferOperation} from './Class/BufferOperation';
import {getSourceCodeInfoFromIid, parseErrorStackTrace} from '../../Util';
import {SourceCodeInfo} from '../Class/SourceCodeInfo';
import {strict as assert} from 'assert';
import asyncHooks from 'async_hooks';

// Since buffer is used in many modules, we need to log its declarations in a shared object
export class BufferLogStore
{
    private static bufferToBufferDeclaration: WeakMap<ArrayBufferLike, BufferDeclaration> = new WeakMap();
    private static bufferDeclarations: BufferDeclaration[] = [];

    public static getBufferDeclaration(buffer: BufferLike)
    {
        const underArrayBuffer = util.types.isAnyArrayBuffer(buffer) ? buffer : buffer.buffer;
        const bufferDeclaration = BufferLogStore.bufferToBufferDeclaration.get(underArrayBuffer);
        if (bufferDeclaration === undefined)
        {
            const newBufferDeclaration = new BufferDeclaration(underArrayBuffer);
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

    public static appendBufferOperation(buffer: BufferLike, type: 'read' | 'write', sourceCodeInfo: SourceCodeInfo): void;
    public static appendBufferOperation(buffer: BufferLike, type: 'read' | 'write', sandbox: Sandbox, iid: number): void;
    public static appendBufferOperation(buffer: BufferLike, type: 'read' | 'write', sandboxOrSourceCodeInfo: Sandbox | SourceCodeInfo, iid?: number): void
    {
        const bufferDeclaration = BufferLogStore.getBufferDeclaration(buffer);
        if (sandboxOrSourceCodeInfo instanceof SourceCodeInfo)
        {
            bufferDeclaration.appendOperation(AsyncContextLogStore.getFunctionCallFromAsyncId(asyncHooks.executionAsyncId()),
                new BufferOperation(type, parseErrorStackTrace(new Error().stack), sandboxOrSourceCodeInfo));
        }
        else    // sandbox
        {
            assert.ok(iid !== undefined);
            bufferDeclaration.appendOperation(AsyncContextLogStore.getFunctionCallFromAsyncId(asyncHooks.executionAsyncId()),
                new BufferOperation(type, parseErrorStackTrace(new Error().stack), getSourceCodeInfoFromIid(iid, sandboxOrSourceCodeInfo)));
        }
    }
}