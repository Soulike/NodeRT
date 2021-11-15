// DO NOT INSTRUMENT

import {BufferLike} from '../../../Analysis/Type/BufferLike';
import {RaceDetector} from '../../../RaceDetector';
import {AsyncCalledFunctionInfo} from '../../Class/AsyncCalledFunctionInfo';
import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {BufferInfo} from './BufferInfo';
import {BufferOperation} from './BufferOperation';

export class BufferDeclaration extends ResourceDeclaration
{
    private readonly bufferInfo: BufferInfo;
    private readonly asyncContextToOperations: Map<AsyncCalledFunctionInfo, BufferOperation[]>;

    constructor(buffer: ArrayBufferLike, possibleDefineCodeScope: SourceCodeInfo|null)
    {
        super();
        this.bufferInfo = new BufferInfo(buffer, possibleDefineCodeScope);
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