import {ResourceOperation} from '../../Class/ResourceOperation';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {EventEmitterOperationKind} from '../Type/EventEmitterOperationKind';

export class EventEmitterOperation extends ResourceOperation
{
    private readonly operationKind: EventEmitterOperationKind;

    constructor(type: 'read' | 'write', operationKind: EventEmitterOperation['operationKind'], stackTrace: string[] | null, sourceCodeScopeInfo: SourceCodeInfo)
    {
        super(type, stackTrace, sourceCodeScopeInfo);
        this.operationKind = operationKind;
    }

    public getOperationKind()
    {
        return this.operationKind;
    }
}