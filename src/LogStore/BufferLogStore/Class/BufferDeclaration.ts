// DO NOT INSTRUMENT

import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {CallbackFunction} from '../../Class/CallbackFunction';
import {BufferOperation} from './BufferOperation';
import {BufferLike} from '../../../Analysis/Type/BufferLike';
import {ArrayBufferLike} from '../../../Analysis/Type/ArrayBufferLike';
import util from 'util';
import {RaceDetector} from '../../../RaceDetector';

export class BufferDeclaration extends ResourceDeclaration
{
    private readonly bufferWeakRef: WeakRef<ArrayBufferLike>;
    private readonly callbackFunctionToOperations: Map<CallbackFunction, BufferOperation[]>;

    constructor(buffer: ArrayBufferLike)
    {
        super();
        this.bufferWeakRef = new WeakRef(buffer);
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
        RaceDetector.emit('operationAppended', this);
    }

    public override getCallbackFunctionToOperations(): ReadonlyMap<CallbackFunction, BufferOperation[]>
    {
        return this.callbackFunctionToOperations;
    }

    public is(otherBuffer: BufferLike): boolean
    {
        if (util.types.isAnyArrayBuffer(otherBuffer))
        {
            return this.bufferWeakRef.deref() === otherBuffer;
        }
        else
        {
            return this.bufferWeakRef.deref() === otherBuffer.buffer;
        }
    }

    public toJSON()
    {
        return {...this, bufferWeakRef: '<Buffer>'};
    }
}