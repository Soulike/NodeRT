import {ResourceInfo} from '../../Class/ResourceInfo';
import {EventEmitter} from 'events';

export class EventEmitterInfo extends ResourceInfo
{
    private readonly eventEmitter: EventEmitter;
    private readonly event: string | symbol;

    constructor(eventEmitter: EventEmitter, event: string | symbol)
    {
        super('eventEmitter');
        this.eventEmitter = eventEmitter;
        this.event = event;
    }

    public is(other: unknown, event?: string | symbol): boolean
    {
        return this.eventEmitter === other && event === this.event;
    }
}