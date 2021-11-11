import {ResourceOperation} from '../../Class/ResourceOperation';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {EventEmitterOperationKind} from '../Type/EventEmitterOperationKind';

export class EventEmitterOperation extends ResourceOperation
{
    private readonly operationKind: EventEmitterOperationKind;
    private readonly affectedListeners: ReadonlySet<Function>;

    constructor(type: 'read' | 'write', operationKind: EventEmitterOperation['operationKind'], affectedListeners: EventEmitterOperation['affectedListeners'], stackTrace: string[] | null, sourceCodeScopeInfo: SourceCodeInfo)
    {
        super(type, stackTrace, sourceCodeScopeInfo);
        this.operationKind = operationKind;
        this.affectedListeners = affectedListeners;
    }

    public getOperationKind()
    {
        return this.operationKind;
    }

    public getAffectedListeners()
    {
        return this.affectedListeners;
    }
}