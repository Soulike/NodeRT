// DO NOT INSTRUMENT

import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {ResourceOperation} from '../../Class/ResourceOperation';
import {StatisticsStore} from '../../StatisticsStore';

export class PrimitiveOperation extends ResourceOperation
{
    constructor(type: 'read' | 'write', stackTrace: string[] | null, sourceCodeScopeInfo: SourceCodeInfo)
    {
        super(type, stackTrace, sourceCodeScopeInfo);
        StatisticsStore.addPrimitiveOperationCount();
    }
}