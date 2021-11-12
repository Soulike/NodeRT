// DO NOT INSTRUMENT

import {ResourceOperation} from '../../Class/ResourceOperation';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {StatisticsStore} from '../../StatisticsStore';

export class BufferOperation extends ResourceOperation
{
    private readonly accessStage: 'start' | 'finish';
    private readonly fields: ReadonlySet<number>;

    constructor(type: 'read' | 'write', accessStage: BufferOperation['accessStage'], fields: BufferOperation['fields'], stackTrace: string[] | null, sourceCodeScopeInfo: SourceCodeInfo)
    {
        super(type, stackTrace, sourceCodeScopeInfo);
        this.accessStage = accessStage;
        this.fields = fields;
        StatisticsStore.addBufferOperationCount();
    }

    public getAccessStage()
    {
        return this.accessStage;
    }

    public getFields()
    {
        return this.fields;
    }

    public toJSON()
    {
        return {
            ...this,
            fields: Array.from(this.fields)
        }
    }
}