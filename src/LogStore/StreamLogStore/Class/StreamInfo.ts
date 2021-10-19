import {ResourceInfo} from '../../Class/ResourceInfo';
import {Readable, Writable} from 'stream';
import {StatisticsStore} from '../../StatisticsStore';

export class StreamInfo extends ResourceInfo
{
    private readonly streamWeakRef: WeakRef<Readable | Writable>;

    constructor(stream: Readable | Writable)
    {
        super('stream');
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