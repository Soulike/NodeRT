import {EventEmitter} from 'events';
import {EventEmitterDeclaration} from './Class/EventEmitterDeclaration';
import {SourceCodeInfo} from '../Class/SourceCodeInfo';
import {EventEmitterOperation} from './Class/EventEmitterOperation';
import {AsyncContextLogStore} from '../AsyncContextLogStore';
import asyncHooks from 'async_hooks';
import {CallStackLogStore} from '../CallStackLogStore';

export class EventEmitterLogStore
{
    private static readonly eventEmitterToEventEmitterDeclaration:
        WeakMap<EventEmitter, { [event: string | symbol]: EventEmitterDeclaration }> = new WeakMap();
    private static readonly eventEmitterDeclarations: EventEmitterDeclaration[] = [];

    public static getEventEmitterDeclaration(eventEmitter: EventEmitter, event: string | symbol, sourceCodeInfo: SourceCodeInfo): EventEmitterDeclaration
    {
        const eventToEventEmitterDeclaration = EventEmitterLogStore.eventEmitterToEventEmitterDeclaration.get(eventEmitter);
        if (eventToEventEmitterDeclaration === undefined)
        {
            const newEventEmitterDeclaration = new EventEmitterDeclaration(eventEmitter, event, sourceCodeInfo);
            EventEmitterLogStore.eventEmitterToEventEmitterDeclaration.set(eventEmitter, {[event]: newEventEmitterDeclaration});
            EventEmitterLogStore.eventEmitterDeclarations.push(newEventEmitterDeclaration);
            return newEventEmitterDeclaration;
        }
        else
        {
            const eventEmitterDeclaration = eventToEventEmitterDeclaration[event];
            if (eventEmitterDeclaration === undefined)
            {
                const newEventEmitterDeclaration = new EventEmitterDeclaration(eventEmitter, event, sourceCodeInfo);
                EventEmitterLogStore.eventEmitterDeclarations.push(newEventEmitterDeclaration);
                eventToEventEmitterDeclaration[event] = newEventEmitterDeclaration;
                return newEventEmitterDeclaration;
            }
            else
            {
                return eventEmitterDeclaration;
            }
        }
    }

    public static getEventEmitterDeclarations(): readonly EventEmitterDeclaration[]
    {
        return this.eventEmitterDeclarations;
    }

    public static appendOperation(eventEmitter: EventEmitter, event: string | symbol,
                                  type: 'read' | 'write', operationKind: EventEmitterOperation['operationKind'], sourceCodeInfo: SourceCodeInfo)
    {
        const eventDeclaration = EventEmitterLogStore.getEventEmitterDeclaration(eventEmitter, event, sourceCodeInfo);
        const asyncContext = AsyncContextLogStore.getAsyncContextFromAsyncId(asyncHooks.executionAsyncId());
        if (type === 'write')
        {
            asyncContext.setHasWriteOperation(eventDeclaration);
        }
        eventDeclaration.appendOperation(asyncContext,
            new EventEmitterOperation(type, operationKind, CallStackLogStore.getCallStack(), sourceCodeInfo));
    }
}