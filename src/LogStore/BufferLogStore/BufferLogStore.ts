// DO NOT INSTRUMENT

import {BufferDeclaration} from './Class/BufferDeclaration';
import BufferLike from '../../Analysis/Type/BufferLike';
import util from 'util';
import ArrayBufferLike from '../../Analysis/Type/ArrayBufferLike';

// Since buffer is used in many modules, we need to log its declarations in a shared object
export class BufferLogStore
{
    private static bufferToBufferDeclaration: Map<ArrayBufferLike, BufferDeclaration> = new Map();

    public static getBufferDeclaration(buffer: BufferLike)
    {
        const underArrayBuffer = util.types.isAnyArrayBuffer(buffer) ? buffer : buffer.buffer;
        const bufferDeclaration = BufferLogStore.bufferToBufferDeclaration.get(underArrayBuffer);
        if (bufferDeclaration === undefined)
        {
            const newBufferDeclaration = new BufferDeclaration(underArrayBuffer);
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
        return Array.from(this.bufferToBufferDeclaration.values());
    }
}