// DO NOT INSTRUMENT

import {ResourceOperation} from '../../Class/ResourceOperation';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {StatisticsStore} from '../../StatisticsStore';

export class SocketOperation extends ResourceOperation
{
    private readonly operationKind: 'construct' | 'destroy' | 'pause' | 'resume' | 'write' | 'end';

    constructor(type: 'read' | 'write', operationKind: SocketOperation['operationKind'], stackTrace: string[] | null, sourceCodeScopeInfo: SourceCodeInfo)
    {
        // only write for socket
        super(type, stackTrace, sourceCodeScopeInfo);
        this.operationKind = operationKind;
        StatisticsStore.addSocketOperationCount();
    }

    public getOperationKind()
    {
        return this.operationKind;
    }
}