// DO NOT INSTRUMENT

import EventEmitter from 'events';
import {ResourceDeclaration} from '../LogStore/Class/ResourceDeclaration';
import {outputSync, toJSON} from '../Util';
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

const outputs: object[] = [];

process.on('exit', () =>
{
    outputSync(toJSON(outputs), 'violations.json');
});

eventEmitter.on('operationAppended', (resourceDeclaration) =>
{
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
});

eventEmitter.on('operationAppended', (resourceDeclaration) =>
{
    aggressiveDetector(resourceDeclaration);
});