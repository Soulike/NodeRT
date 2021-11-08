// DO NOT INSTRUMENT

import {ResourceOperation} from '../../Class/ResourceOperation';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {StatisticsStore} from '../../StatisticsStore';
import {FileOperationOnType} from '../Type/FileOperationOnType';

export class FileOperation extends ResourceOperation
{
    private readonly operationOn: FileOperationOnType;

    constructor(type: 'read' | 'write', operationOn: FileOperation['operationOn'], stackTrace: string[] | null, sourceCodeScopeInfo: SourceCodeInfo)
    {
        super(type, stackTrace, sourceCodeScopeInfo);
        this.operationOn = operationOn;
        StatisticsStore.addFileOperationCount();
    }

    public getOperationOn()
    {
        return this.operationOn;
    }
}