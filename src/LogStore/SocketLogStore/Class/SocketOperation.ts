// DO NOT INSTRUMENT

import {SocketOperationKind} from '../Type/OperationKind';
import {ResourceOperation} from '../../Class/ResourceOperation';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {StatisticsStore} from '../../StatisticsStore';

export class SocketOperation extends ResourceOperation
{
    private readonly operationKind: SocketOperationKind;

    constructor(type: 'read' | 'write', operationKind: SocketOperation['operationKind'], stackTrace: string[] | null, sourceCodeScopeInfo: SourceCodeInfo|null)
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