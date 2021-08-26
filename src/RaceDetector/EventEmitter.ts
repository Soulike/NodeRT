// DO NOT INSTRUMENT

import EventEmitter from 'events';
import {ResourceDeclaration} from '../LogStore/Class/ResourceDeclaration';
import {toJSON} from '../Util';
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
    const violationInfo = conservativeDetector(resourceDeclaration);
    if (violationInfo !== null)
    {
        const {
            resourceDeclaration,
            atomicOperationsPairIndexes,
            violatingOperationIndex} = violationInfo;
        const callbackFunctionToOperationsArray = Array.from(resourceDeclaration.getCallbackFunctionToOperations());
        const modifiedResourceDeclaration: any = {...resourceDeclaration};
        delete modifiedResourceDeclaration.callbackFunctionToOperations;
        delete modifiedResourceDeclaration.operations;
        
        console.log(
`on
${toJSON(modifiedResourceDeclaration)}
found violation
${toJSON(callbackFunctionToOperationsArray[atomicOperationsPairIndexes[0]])}
and
${toJSON(callbackFunctionToOperationsArray[atomicOperationsPairIndexes[1]])}
are violated by
${toJSON(callbackFunctionToOperationsArray[violatingOperationIndex])}
`);
    }
});
eventEmitter.on('operationAppended', (resourceDeclaration) =>
{
    aggressiveDetector(resourceDeclaration);
});