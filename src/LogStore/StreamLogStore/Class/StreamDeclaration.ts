// DO NOT INSTRUMENT

import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {AsyncCalledFunctionInfo} from '../../Class/AsyncCalledFunctionInfo';
import {StreamOperation} from './StreamOperation';
import {Readable, Writable} from 'stream';
import {RaceDetector} from '../../../RaceDetector';
import {StatisticsStore} from '../../StatisticsStore';

export class StreamDeclaration extends ResourceDeclaration
{
    private readonly streamWeakRef: WeakRef<Readable | Writable>;
    private readonly asyncContextToOperations: Map<AsyncCalledFunctionInfo, StreamOperation[]>;

    constructor(stream: Readable | Writable)
    {
        super();
        this.streamWeakRef = new WeakRef(stream);
        this.asyncContextToOperations = new Map();
        StatisticsStore.addStreamCount();
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
        return this.streamWeakRef.deref() === other;
    }

    public toJSON()
    {
        return {
            ...this,
            streamWeakRef: '<Stream>',
        };
    }
}