import {Readable, Writable} from 'stream';
import {ResourceInfo} from '../../Class/ResourceInfo';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {StatisticsStore} from '../../StatisticsStore';

export class StreamInfo extends ResourceInfo
{
    private readonly streamWeakRef: WeakRef<Readable | Writable>;

    constructor(stream: Readable | Writable, possibleDefineCodeScope: SourceCodeInfo | null)
    {
        super('stream', possibleDefineCodeScope);
        this.streamWeakRef = new WeakRef(stream);
        StatisticsStore.addStreamCount();
    }

    public getStreamWeakRef()
    {
        return this.streamWeakRef;
    }

    public is(other: unknown)
    {
        return other === this.streamWeakRef.deref();
    }

    public toJSON()
    {
        return {
            ...this,
            streamWeakRef: undefined,
        };
    }
}