// DO NOT INSTRUMENT

import {SourceCodeInfo} from './SourceCodeInfo';

export abstract class ResourceOperation
{
    private readonly type: 'read' | 'write';
    private readonly scopeCodeInfo: SourceCodeInfo;
    private readonly stackTrace: string | null;

    protected constructor(type: 'read' | 'write', stackTrace: string | null, sourceCodeScopeInfo: SourceCodeInfo)
    {
        this.type = type;
        this.stackTrace = stackTrace;
        this.scopeCodeInfo = sourceCodeScopeInfo;
    }

    public getType()
    {
        return this.type;
    }

    public getScopeCodeInfo()
    {
        return this.scopeCodeInfo;
    }

    public getStackTrace()
    {
        return this.stackTrace;
    }
}