// DO NOT INSTRUMENT

import {ResourceOperation} from '../../Class/ResourceOperation';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {StatisticsStore} from '../../StatisticsStore';

export class ObjectOperation extends ResourceOperation
{
    /**
     * `null` represents unknown
     */
    public readonly field: any | null;

    constructor(type: 'read' | 'write', field: any | null, stackTrace: string[] | null, sourceCodeScopeInfo: SourceCodeInfo)
    {
        super(type, stackTrace, sourceCodeScopeInfo);
        this.field = field;
        StatisticsStore.addObjectOperationCount();
    }
}