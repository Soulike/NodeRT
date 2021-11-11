// DO NOT INSTRUMENT

import {SourceCodeInfo} from './SourceCodeInfo';

export abstract class ResourceOperation
{
    private readonly type: 'read' | 'write';
    private readonly scopeCodeInfo: SourceCodeInfo;
    private readonly stackTrace: string[] | null;
    private readonly index: number;
    private readonly timestamp: bigint; // nanoseconds

    private static lastIndex = 0;

    protected constructor(type: 'read' | 'write', stackTrace: string[] | null, sourceCodeScopeInfo: SourceCodeInfo)
    {
        this.type = type;
        this.stackTrace = stackTrace;
        this.scopeCodeInfo = sourceCodeScopeInfo;
        this.index = ResourceOperation.lastIndex++;
        this.timestamp = process.hrtime.bigint();
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

    public getIndex()
    {
        return this.index;
    }

    public getTimestamp()
    {
        return this.timestamp;
    }
}