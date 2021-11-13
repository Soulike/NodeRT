// DO NOT INSTRUMENT

import {ResourceOperation} from '../../Class/ResourceOperation';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {StatisticsStore} from '../../StatisticsStore';

export class BufferOperation extends ResourceOperation
{
    private readonly accessStage: 'start' | 'finish';
    /***
     * [start, end)
     * */
    private readonly accessRange: { start: number, end: number };

    constructor(type: 'read' | 'write', accessStage: BufferOperation['accessStage'], accessRange: BufferOperation['accessRange'], stackTrace: string[] | null, sourceCodeScopeInfo: SourceCodeInfo)
    {
        super(type, stackTrace, sourceCodeScopeInfo);
        this.accessStage = accessStage;
        const {start, end} = accessRange;
        this.accessRange = {start, end};
        StatisticsStore.addBufferOperationCount();
    }

    public getAccessStage()
    {
        return this.accessStage;
    }

    public getAccessRange()
    {
        return this.accessRange;
    }
}