// DO NOT INSTRUMENT

import BufferDeclaration from './Class/BufferDeclaration';
import BufferLike from '../../Type/BufferLike';

// Since buffer is used in many modules, we need to log its declarations in a shared object
class BufferLogger
{
    private static bufferToBufferDeclaration: Map<BufferLike, BufferDeclaration> = new Map();

    public static getBufferDeclaration(buffer: BufferLike)
    {
        const bufferDeclaration = BufferLogger.bufferToBufferDeclaration.get(buffer);
        if (bufferDeclaration === undefined)
        {
            const newBufferDeclaration = new BufferDeclaration(buffer);
            this.bufferToBufferDeclaration.set(buffer, newBufferDeclaration);
            return newBufferDeclaration;
        }
        else
        {
            return bufferDeclaration;
        }
    }

    public static addBufferDeclaration(buffer: BufferLike): void
    {
        const bufferDeclaration = BufferLogger.bufferToBufferDeclaration.get(buffer);
        if (bufferDeclaration === undefined)
        {
            const newBufferDeclaration = new BufferDeclaration(buffer);
            this.bufferToBufferDeclaration.set(buffer, newBufferDeclaration);
        }
    }
}

export default BufferLogger;