// DO NOT INSTRUMENT

import {BufferDeclaration} from './Class/BufferDeclaration';
import {Sandbox} from '../../Type/nodeprof';
import {AsyncContextLogStore} from '../AsyncContextLogStore';
import {BufferOperation} from './Class/BufferOperation';
import {getSourceCodeInfoFromIid} from '../../Util';
import {SourceCodeInfo} from '../Class/SourceCodeInfo';
import {strict as assert} from 'assert';
import asyncHooks from 'async_hooks';
import {CallStackLogStore} from '../CallStackLogStore';
import {EnhancedSet} from '@datastructures-js/set';
import util from 'util';

// Since buffer is used in many modules, we need to log its declarations in a shared object
export class BufferLogStore
{
    private static bufferToBufferDeclaration: WeakMap<ArrayBufferLike, BufferDeclaration> = new WeakMap();
    private static bufferDeclarations: BufferDeclaration[] = [];

    public static getBufferDeclaration(buffer: ArrayBufferLike, sourceCodeInfo: SourceCodeInfo)
    {
        const bufferDeclaration = BufferLogStore.bufferToBufferDeclaration.get(buffer);
        if (bufferDeclaration === undefined)
        {
            const newBufferDeclaration = new BufferDeclaration(buffer, sourceCodeInfo);
            BufferLogStore.bufferDeclarations.push(newBufferDeclaration);
            BufferLogStore.bufferToBufferDeclaration.set(buffer, newBufferDeclaration);
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

    public static appendBufferOperation(buffer: ArrayBufferLike | ArrayBufferView, type: 'read' | 'write', accessStage: BufferOperation['accessStage'], fields: Iterable<number>, sourceCodeInfo: SourceCodeInfo): void;
    public static appendBufferOperation(buffer: ArrayBufferLike | ArrayBufferView, type: 'read' | 'write', accessStage: BufferOperation['accessStage'], fields: Iterable<number>, sandbox: Sandbox, iid: number): void;
    public static appendBufferOperation(buffer: ArrayBufferLike | ArrayBufferView, type: 'read' | 'write', accessStage: BufferOperation['accessStage'], fields: Iterable<number>, sandboxOrSourceCodeInfo: Sandbox | SourceCodeInfo, iid?: number): void
    {
        if (!util.types.isAnyArrayBuffer(buffer))
        {
            buffer = buffer.buffer;
        }
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
                new BufferOperation(type, accessStage, new EnhancedSet(Array.from(fields)), CallStackLogStore.getCallStack(), sandboxOrSourceCodeInfo));
        }
        else    // sandbox
        {
            assert.ok(iid !== undefined);
            bufferDeclaration.appendOperation(asyncContext,
                new BufferOperation(type, accessStage, new EnhancedSet(Array.from(fields)), CallStackLogStore.getCallStack(), getSourceCodeInfoFromIid(iid, sandboxOrSourceCodeInfo)));
        }
    }

    public static getArrayBufferFieldsOfArrayBufferView(arrayBufferView: ArrayBufferView | ArrayBufferLike, start = 0, end = arrayBufferView.byteLength): Iterable<number>
    {
        if (util.types.isAnyArrayBuffer(arrayBufferView))
        {
            arrayBufferView = new DataView(arrayBufferView);
        }
        const result = [];
        for (let i = start; i < end; i++)
        {
            result.push(arrayBufferView.byteOffset + i);
        }
        return result;
    }
}