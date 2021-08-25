// DO NOT INSTRUMENT

import EventEmitter from 'events';
import {ResourceDeclaration} from '../LogStore/Class/ResourceDeclaration';
import {aggressiveDetector} from './AggressiveDetector';
import {conservativeDetector} from './ConservativeDetector';

type EventName = 'operationAppended';

class RaceDetectorEventEmitter extends EventEmitter
{
    constructor()
    {
        super();
    }

    public override emit(eventName: EventName, resourceDeclaration: ResourceDeclaration)
    {
        return super.emit(eventName, resourceDeclaration);
    }

    public override on(evenName: EventName, listener: (resourceDeclaration: ResourceDeclaration) => void)
    {
        return super.on(evenName, listener);
    }
}

export const eventEmitter = new RaceDetectorEventEmitter();

eventEmitter.on('operationAppended', (resourceDeclaration) =>
{
    conservativeDetector(resourceDeclaration);
});
eventEmitter.on('operationAppended', (resourceDeclaration) =>
{
    aggressiveDetector(resourceDeclaration);
});