import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {AsyncCalledFunctionInfo} from '../../Class/AsyncCalledFunctionInfo';
import {EventEmitterOperation} from './EventEmitterOperation';
import {EventEmitterInfo} from './EventEmitterInfo';
import {RaceDetector} from '../../../RaceDetector';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';

export class EventEmitterDeclaration extends ResourceDeclaration
{
    private readonly eventEmitterInfo: EventEmitterInfo;
    private readonly asyncContextToOperations: Map<AsyncCalledFunctionInfo, EventEmitterOperation[]>;

    constructor(eventEmitter: EventEmitterInfo['eventEmitter'], event: EventEmitterInfo['event'], possibleDefineCodeScope: SourceCodeInfo)
    {
        super();
        this.eventEmitterInfo = new EventEmitterInfo(eventEmitter, event, possibleDefineCodeScope);
        this.asyncContextToOperations = new Map();
    }

    public appendOperation(currentCallbackFunction: AsyncCalledFunctionInfo, eventEmitterOperation: EventEmitterOperation): void
    {
        const operations = this.asyncContextToOperations.get(currentCallbackFunction);
        if (operations === undefined)
        {
            this.asyncContextToOperations.set(currentCallbackFunction, [eventEmitterOperation]);
        }
        else
        {
            operations.push(eventEmitterOperation);
        }
        RaceDetector.emit('operationAppended', this);
    }

    public getAsyncContextToOperations(): ReadonlyMap<AsyncCalledFunctionInfo, ReadonlyArray<EventEmitterOperation>>
    {
        return this.asyncContextToOperations;
    }

    public getResourceInfo(): EventEmitterInfo
    {
        return this.eventEmitterInfo;
    }

    public is(other: unknown, event?: string | symbol): boolean
    {
        return this.eventEmitterInfo.is(other, event);
    }
}