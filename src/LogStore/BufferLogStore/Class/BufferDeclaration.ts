// DO NOT INSTRUMENT

import ResourceDeclaration from '../../../Analysis/Class/ResourceDeclaration';
import CallbackFunction from '../../../Analysis/Class/CallbackFunction';
import {BufferOperation} from './BufferOperation';
import BufferLike from '../../../Analysis/Type/BufferLike';
import ArrayBufferLike from '../../../Analysis/Type/ArrayBufferLike';
import util from 'util';

export class BufferDeclaration extends ResourceDeclaration
{
    private readonly buffer: ArrayBufferLike;
    private readonly callbackFunctionToOperations: Map<CallbackFunction, BufferOperation[]>;

    constructor(buffer: ArrayBufferLike)
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
        if (util.types.isAnyArrayBuffer(otherBuffer))
        {
            return this.buffer === otherBuffer;
        }
        else
        {
            return this.buffer === otherBuffer.buffer;
        }
    }

    public toJSON()
    {
        return {...this, buffer: '<Buffer>'};
    }
}