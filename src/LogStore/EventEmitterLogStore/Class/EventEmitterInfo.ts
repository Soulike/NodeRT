import {EventEmitter} from 'events';
import {ResourceInfo} from '../../Class/ResourceInfo';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';

export class EventEmitterInfo extends ResourceInfo
{
    private readonly eventEmitter: WeakRef<EventEmitter>;
    private readonly event: string | symbol;

    constructor(eventEmitter: EventEmitter, event: string | symbol, possibleDefineCodeScope: SourceCodeInfo | null)
    {
        super('eventEmitter', possibleDefineCodeScope);
        this.eventEmitter = new WeakRef(eventEmitter);
        this.event = event;
    }

    public override getHash(): object
    {
        return this;
    }

    public is(other: unknown, event?: string | symbol): boolean
    {
        return this.eventEmitter.deref() === other && event === this.event;
    }

    public toJSON()
    {
        return {
            ...this,
            eventEmitter: undefined,
        };
    }
}