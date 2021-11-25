import {SourceCodeInfo} from './SourceCodeInfo';

export abstract class ResourceInfo
{
    private readonly type: string;
    private readonly possibleDefineCodeScope: SourceCodeInfo | null | null;
    public readonly id: number;

    private static lastId = 0;

    protected constructor(type: string, possibleDefineCodeScope: SourceCodeInfo|null | null)
    {
        this.type = type;
        this.possibleDefineCodeScope = possibleDefineCodeScope;

        this.id = ResourceInfo.lastId++;
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
}