import {EventEmitter} from 'events';
import {ResourceInfo} from '../../Class/ResourceInfo';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {StatisticsStore} from '../../StatisticsStore';
import {isRunningUnitTests} from '../../../Util';

export class EventEmitterInfo extends ResourceInfo
{
    private readonly eventEmitter: WeakRef<EventEmitter>;
    private readonly event: string | symbol;

    constructor(eventEmitter: EventEmitter, event: string | symbol, possibleDefineCodeScope: SourceCodeInfo | null)
    {
        super('eventEmitter', possibleDefineCodeScope);
        this.eventEmitter = new WeakRef(eventEmitter);
        this.event = event;
        StatisticsStore.addEventEmitterCount();
    }

    public override getHash(): object | string
    {
        if (isRunningUnitTests() && typeof this.event === 'string')
        {
            return JSON.stringify({
                ...this,
                eventEmitter: undefined,
            });
        }
        else
        {
            return this;
        }
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