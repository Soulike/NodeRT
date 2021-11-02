import {ResourceInfo} from '../../Class/ResourceInfo';
import {EventEmitter} from 'events';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';

export class EventEmitterInfo extends ResourceInfo
{
    private readonly eventEmitter: EventEmitter;
    private readonly event: string | symbol;

    constructor(eventEmitter: EventEmitter, event: string | symbol, possibleDefineCodeScope: SourceCodeInfo)
    {
        super('eventEmitter', possibleDefineCodeScope);
        this.eventEmitter = eventEmitter;
        this.event = event;
    }

    public is(other: unknown, event?: string | symbol): boolean
    {
        return this.eventEmitter === other && event === this.event;
    }
}