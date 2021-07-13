// DO NOT INSTRUMENT

import {SourceCodeInfo} from './SourceCodeInfo';

export abstract class ResourceOperation
{
    private readonly type: 'read' | 'write';
    private readonly sourceCodeInfo: SourceCodeInfo;

    protected constructor(type: 'read' | 'write', sourceCodeInfo: SourceCodeInfo)
    {
        this.type = type;
        this.sourceCodeInfo = sourceCodeInfo;
    }

    public getType()
    {
        return this.type;
    }

    public getSourceCodeInfo()
    {
        return this.sourceCodeInfo;
    }
}