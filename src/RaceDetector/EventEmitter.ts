// DO NOT INSTRUMENT

import EventEmitter from 'events';
import {ResourceDeclaration} from '../LogStore/Class/ResourceDeclaration';
import {outputSync, toJSON} from '../Util';
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

let timeConsumed = 0;   // ms

const outputs: object[] = [];

process.on('exit', () =>
{
    outputSync(toJSON(outputs), 'violations.json');
    console.log(`Time consumed in RaceDetector: ${timeConsumed / 1000}s`);
});

eventEmitter.on('operationAppended', (resourceDeclaration) =>
{
    const startTimestamp = Date.now();

    const violationInfos = conservativeDetector(resourceDeclaration);
    if (violationInfos !== null)
    {
        for (const violationInfo of violationInfos)
        {
            const {
                resourceDeclaration,
                atomicOperationsPairIndexes,
                violatingOperationIndex,
            } = violationInfo;
            const callbackFunctionToOperationsArray = Array.from(resourceDeclaration.getCallbackFunctionToOperations());
            const modifiedResourceDeclaration: any = {...resourceDeclaration};
            delete modifiedResourceDeclaration.callbackFunctionToOperations;
            delete modifiedResourceDeclaration.operations;

            const output = {
                resource: modifiedResourceDeclaration,
                atomicPair: [
                    callbackFunctionToOperationsArray[atomicOperationsPairIndexes[0]],
                    callbackFunctionToOperationsArray[atomicOperationsPairIndexes[1]],
                ],
                violator: callbackFunctionToOperationsArray[violatingOperationIndex],
            };

            outputs.push(output);
        }
    }

    timeConsumed += (Date.now() - startTimestamp);
});

/* eventEmitter.on('operationAppended', (resourceDeclaration) =>
{
    aggressiveDetector(resourceDeclaration);
}); */