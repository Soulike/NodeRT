// DO NOT INSTRUMENT

import {ResourceOperation} from '../../Class/ResourceOperation';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {StatisticsStore} from '../../StatisticsStore';

export class OutgoingMessageOperation extends ResourceOperation
{
    private readonly operationKind: 'construct' | 'destroy' | 'write' | 'end';

    constructor(type: 'read' | 'write', operationKind: OutgoingMessageOperation['operationKind'], stackTrace: string[] | null, sourceCodeScopeInfo: SourceCodeInfo)
    {
        // only write for socket
        super(type, stackTrace, sourceCodeScopeInfo);
        this.operationKind = operationKind;
        StatisticsStore.addOutgoingMessageOperationCount();
    }

    public getOperationKind()
    {
        return this.operationKind;
    }
}