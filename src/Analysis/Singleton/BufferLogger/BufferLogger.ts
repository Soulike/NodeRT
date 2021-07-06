// DO NOT INSTRUMENT

import BufferDeclaration from './Class/BufferDeclaration';

class BufferLogger
{
    private static bufferToBufferDeclaration: Map<Buffer, BufferDeclaration> = new Map();

    public static getBufferDeclaration(buffer: Buffer)
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
}

export default BufferLogger;