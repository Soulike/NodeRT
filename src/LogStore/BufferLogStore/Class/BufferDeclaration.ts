// DO NOT INSTRUMENT

import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {AsyncCalledFunctionInfo} from '../../Class/AsyncCalledFunctionInfo';
import {BufferOperation} from './BufferOperation';
import {BufferLike} from '../../../Analysis/Type/BufferLike';
import {ArrayBufferLike} from '../../../Analysis/Type/ArrayBufferLike';
import {RaceDetector} from '../../../RaceDetector';
import {BufferInfo} from './BufferInfo';

export class BufferDeclaration extends ResourceDeclaration
{
    private readonly bufferInfo: BufferInfo;
    private readonly asyncContextToOperations: Map<AsyncCalledFunctionInfo, BufferOperation[]>;

    constructor(buffer: ArrayBufferLike)
    {
        super();
        this.bufferInfo = new BufferInfo(buffer);
        this.asyncContextToOperations = new Map();
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
        return this.bufferInfo.is(otherBuffer);
    }

    getResourceInfo(): BufferInfo
    {
        return this.bufferInfo;
    }
}