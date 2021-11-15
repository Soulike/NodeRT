// DO NOT INSTRUMENT

import {StreamOperationKind} from '..';
import {ResourceOperation} from '../../Class/ResourceOperation';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {StatisticsStore} from '../../StatisticsStore';

export class StreamOperation extends ResourceOperation
{
    private readonly operationKind: StreamOperationKind;

    constructor(type: 'read' | 'write', operationKind: StreamOperation['operationKind'], stackTrace: string[] | null, sourceCodeScopeInfo: SourceCodeInfo|null)
    {
        super(type, stackTrace, sourceCodeScopeInfo);
        this.operationKind = operationKind;
        StatisticsStore.addStreamOperationCount();
    }

    public getOperationKind()
    {
        return this.operationKind;
    }
}