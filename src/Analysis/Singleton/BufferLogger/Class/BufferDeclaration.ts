// DO NOT INSTRUMENT

import ResourceDeclaration from '../../../Class/ResourceDeclaration';
import CallbackFunction from '../../../Class/CallbackFunction';
import BufferOperation from './BufferOperation';
import BufferLike from '../../../Type/BufferLike';

class BufferDeclaration extends ResourceDeclaration
{
    private readonly buffer: BufferLike;
    private readonly callbackFunctionToOperations: Map<CallbackFunction, BufferOperation[]>;

    constructor(buffer: BufferLike)
    {
        super();
        this.buffer = buffer;
        this.callbackFunctionToOperations = new Map();
    }

    public appendOperation(currentCallbackFunction: CallbackFunction, bufferOperation: BufferOperation): void
    {
        const operations = this.callbackFunctionToOperations.get(currentCallbackFunction);
        if (operations === undefined)
        {
            this.callbackFunctionToOperations.set(currentCallbackFunction, [bufferOperation]);
        }
        else
        {
            operations.push(bufferOperation);
        }
    }

    public getOperations(): ReadonlyMap<CallbackFunction, BufferOperation[]>
    {
        return this.callbackFunctionToOperations;
    }

    public is(otherBuffer: BufferLike): boolean
    {
        return this.buffer === otherBuffer;
    }
}

export default BufferDeclaration;