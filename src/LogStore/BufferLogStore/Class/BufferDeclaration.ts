// DO NOT INSTRUMENT

import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {AsyncCalledFunctionInfo} from '../../Class/AsyncCalledFunctionInfo';
import {BufferOperation} from './BufferOperation';
import {BufferLike} from '../../../Analysis/Type/BufferLike';
import {ArrayBufferLike} from '../../../Analysis/Type/ArrayBufferLike';
import util from 'util';
import {RaceDetector} from '../../../RaceDetector';
import {StatisticsStore} from '../../StatisticsStore';

export class BufferDeclaration extends ResourceDeclaration
{
    private readonly bufferWeakRef: WeakRef<ArrayBufferLike>;
    private readonly asyncContextToOperations: Map<AsyncCalledFunctionInfo, BufferOperation[]>;

    constructor(buffer: ArrayBufferLike)
    {
        super();
        this.bufferWeakRef = new WeakRef(buffer);
        this.asyncContextToOperations = new Map();
        StatisticsStore.addBufferCount();
    }

    public appendOperation(currentCallbackFunction: AsyncCalledFunctionInfo, bufferOperation: BufferOperation): void
    {
        const operations = this.asyncContextToOperations.get(currentCallbackFunction);
        if (operations === undefined)
        {
            this.asyncContextToOperations.set(currentCallbackFunction, [bufferOperation]);
        }
        else
        {
            operations.push(bufferOperation);
        }
        RaceDetector.emit('operationAppended', this);
    }

    public override getAsyncContextToOperations(): ReadonlyMap<AsyncCalledFunctionInfo, BufferOperation[]>
    {
        return this.asyncContextToOperations;
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