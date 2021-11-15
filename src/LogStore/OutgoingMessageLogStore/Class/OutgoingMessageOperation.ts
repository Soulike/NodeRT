// DO NOT INSTRUMENT

import {OutgoingMessageOperationKind} from '../Type/OutgoingMessageOperationKind';
import {ResourceOperation} from '../../Class/ResourceOperation';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {StatisticsStore} from '../../StatisticsStore';

export class OutgoingMessageOperation extends ResourceOperation
{
    private readonly operationKind: OutgoingMessageOperationKind;

    constructor(type: 'read' | 'write', operationKind: OutgoingMessageOperation['operationKind'], stackTrace: string[] | null, sourceCodeScopeInfo: SourceCodeInfo|null)
    {
        super(type, stackTrace, sourceCodeScopeInfo);
        this.operationKind = operationKind;
        StatisticsStore.addOutgoingMessageOperationCount();
    }

    public getOperationKind()
    {
        return this.operationKind;
    }
}