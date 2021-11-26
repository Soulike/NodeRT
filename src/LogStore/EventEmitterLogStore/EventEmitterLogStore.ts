import {EnhancedSet} from '@datastructures-js/set';
import asyncHooks from 'async_hooks';
import {EventEmitter} from 'events';
import {AsyncContextLogStore} from '../AsyncContextLogStore';
import {CallStackLogStore} from '../CallStackLogStore';
import {SourceCodeInfo} from '../Class/SourceCodeInfo';
import {EventEmitterDeclaration} from './Class/EventEmitterDeclaration';
import {EventEmitterOperation} from './Class/EventEmitterOperation';

export class EventEmitterLogStore
{
    private static readonly eventEmitterToEventEmitterDeclaration:
        WeakMap<EventEmitter, { [event: string | symbol]: EventEmitterDeclaration }> = new WeakMap();
    private static readonly eventEmitterDeclarations: EventEmitterDeclaration[] = [];

    public static getEventEmitterDeclaration(eventEmitter: EventEmitter, event: string | symbol, sourceCodeInfo: SourceCodeInfo | null): EventEmitterDeclaration
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
                                  type: 'read' | 'write', operationKind: EventEmitterOperation['operationKind'], affectedListeners: Iterable<Function>, sourceCodeInfo: SourceCodeInfo | null)
    {
        const eventDeclaration = EventEmitterLogStore.getEventEmitterDeclaration(eventEmitter, event, sourceCodeInfo);
        const asyncContext = AsyncContextLogStore.getAsyncContextFromAsyncId(asyncHooks.executionAsyncId());
        if (type === 'write')
        {
            asyncContext.setHasWriteOperation(eventDeclaration);
        }
        eventDeclaration.appendOperation(asyncContext,
            new EventEmitterOperation(type, operationKind, new EnhancedSet(Array.from(affectedListeners)), CallStackLogStore.getCallStack(), sourceCodeInfo));
    }
}