// DO NOT INSTRUMENT

import EventEmitter from 'events';
import {ResourceDeclaration} from '../LogStore/Class/ResourceDeclaration';
import {outputSync, shouldBeVerbose, toJSON} from '../Util';
import {raceConditionDetector} from './RaceConditionDetector';

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

let timeConsumed = 0;   // ms

const outputs: object[] = [];

process.on('exit', () =>
{
    const startTimestamp = Date.now();
    outputSync(toJSON(outputs), 'violations.json');
    timeConsumed += Date.now() - startTimestamp;
    if (shouldBeVerbose())
    {
        console.log(`RaceDetector: ${timeConsumed / 1000}s`);
    }
});

eventEmitter.on('operationAppended', (resourceDeclaration) =>
{
    const startTimestamp = Date.now();

    const raceConditionInfos = raceConditionDetector(resourceDeclaration);
    for (const raceConditionInfo of raceConditionInfos)
    {
        outputs.push(raceConditionInfo);
    }

    timeConsumed += (Date.now() - startTimestamp);
});