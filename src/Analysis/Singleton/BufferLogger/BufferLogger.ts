// DO NOT INSTRUMENT

import BufferDeclaration from './Class/BufferDeclaration';
import BufferLike from '../../Type/BufferLike';
import {isArrayBufferLike} from '../../Util';

// Since buffer is used in many modules, we need to log its declarations in a shared object
class BufferLogger
{
    private static bufferToBufferDeclaration: Map<BufferLike, BufferDeclaration> = new Map();

    public static getBufferDeclaration(buffer: BufferLike)
    {
        const underArrayBuffer = isArrayBufferLike(buffer) ? buffer : buffer.buffer;
        const bufferDeclaration = BufferLogger.bufferToBufferDeclaration.get(underArrayBuffer);
        if (bufferDeclaration === undefined)
        {
            const newBufferDeclaration = new BufferDeclaration(underArrayBuffer);
            this.bufferToBufferDeclaration.set(buffer, newBufferDeclaration);
            return newBufferDeclaration;
        }
        else
        {
            return bufferDeclaration;
        }
    }
}

export default BufferLogger;