// DO NOT INSTRUMENT

import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {AsyncCalledFunctionInfo} from '../../Class/AsyncCalledFunctionInfo';
import {StreamOperation} from './StreamOperation';
import {Readable, Writable} from 'stream';
import {RaceDetector} from '../../../RaceDetector';
import {StreamInfo} from './StreamInfo';

export class StreamDeclaration extends ResourceDeclaration
{
    private readonly streamInfo: StreamInfo;
    private readonly asyncContextToOperations: Map<AsyncCalledFunctionInfo, StreamOperation[]>;

    constructor(stream: Readable | Writable)
    {
        super();
        this.streamInfo = new StreamInfo(stream);
        this.asyncContextToOperations = new Map();
    }

    public override getResourceInfo(): StreamInfo
    {
        return this.streamInfo;
    }

    public appendOperation(currentCallbackFunction: AsyncCalledFunctionInfo, streamOperation: StreamOperation): void
    {
        const operations = this.asyncContextToOperations.get(currentCallbackFunction);
        if (operations === undefined)
        {
            this.asyncContextToOperations.set(currentCallbackFunction, [streamOperation]);
        }
        else
        {
            operations.push(streamOperation);
        }
        RaceDetector.emit('operationAppended', this);
    }

    public getAsyncContextToOperations(): ReadonlyMap<AsyncCalledFunctionInfo, StreamOperation[]>
    {
        return this.asyncContextToOperations;
    }

    public is(other: unknown): boolean
    {
        return this.streamInfo.is(other);
    }
}