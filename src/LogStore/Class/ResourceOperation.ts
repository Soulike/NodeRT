// DO NOT INSTRUMENT

import {SourceCodeInfo} from './SourceCodeInfo';

export abstract class ResourceOperation
{
    private readonly type: 'read' | 'write';
    private readonly sourceCodeScopeInfo: SourceCodeInfo;
    private readonly stackTrace: string[] | null;

    protected constructor(type: 'read' | 'write', stackTrace: string[] | null, sourceCodeScopeInfo: SourceCodeInfo)
    {
        this.type = type;
        this.stackTrace = stackTrace;
        this.sourceCodeScopeInfo = sourceCodeScopeInfo;
    }

    public getType()
    {
        return this.type;
    }

    public getSourceCodeScopeInfo()
    {
        return this.sourceCodeScopeInfo;
    }

    public getStackTrace()
    {
        return this.stackTrace;
    }
}