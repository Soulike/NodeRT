// DO NOT INSTRUMENT

import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {CallbackFunction} from '../../Class/CallbackFunction';
import {StreamOperation} from './StreamOperation';
import {Readable, Writable} from 'stream';
import {RaceDetector} from '../../../RaceDetector';
import {StatisticsStore} from '../../StatisticsStore';

export class StreamDeclaration extends ResourceDeclaration
{
    private readonly streamWeakRef: WeakRef<Readable | Writable>;
    private readonly operations: Map<CallbackFunction, StreamOperation[]>;

    constructor(stream: Readable | Writable)
    {
        super();
        this.streamWeakRef = new WeakRef(stream);
        this.operations = new Map();
        StatisticsStore.addStreamCount();
    }

    public appendOperation(currentCallbackFunction: CallbackFunction, streamOperation: StreamOperation): void
    {
        const operations = this.operations.get(currentCallbackFunction);
        if (operations === undefined)
        {
            this.operations.set(currentCallbackFunction, [streamOperation]);
        }
        else
        {
            operations.push(streamOperation);
        }
        RaceDetector.emit('operationAppended', this);
    }

    public getCallbackFunctionToOperations(): ReadonlyMap<CallbackFunction, StreamOperation[]>
    {
        return this.operations;
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