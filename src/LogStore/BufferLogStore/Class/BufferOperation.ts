// DO NOT INSTRUMENT

import {ResourceOperation} from '../../Class/ResourceOperation';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {StatisticsStore} from '../../StatisticsStore';

export class BufferOperation extends ResourceOperation
{
    private readonly accessStage: 'start' | 'finish';

    constructor(type: 'read' | 'write', accessStage: BufferOperation['accessStage'], stackTrace: string[] | null, sourceCodeScopeInfo: SourceCodeInfo)
    {
        super(type, stackTrace, sourceCodeScopeInfo);
        this.accessStage = accessStage;
        StatisticsStore.addBufferOperationCount();
    }

    public getAccessStage()
    {
        return this.accessStage;
    }
}