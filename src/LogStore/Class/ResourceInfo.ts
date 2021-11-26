import {SourceCodeInfo} from './SourceCodeInfo';

export abstract class ResourceInfo
{
    private readonly type: string;
    private readonly possibleDefineCodeScope: SourceCodeInfo | null;

    protected constructor(type: string, possibleDefineCodeScope: SourceCodeInfo | null)
    {
        this.type = type;
        this.possibleDefineCodeScope = possibleDefineCodeScope;
    }

    public getType()
    {
        return this.type;
    };

    public getPossibleDefineCodeScope()
    {
        return this.possibleDefineCodeScope;
    }

    public abstract is(...other: unknown[]): boolean;

    /**
     * Used for filtering duplicates
     */
    public abstract getHash(): string | object;
}