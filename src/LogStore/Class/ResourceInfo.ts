export abstract class ResourceInfo
{
    private readonly type: string;

    protected constructor(type: string)
    {
        this.type = type;
    }

    public getType()
    {
        return this.type;
    };

    public abstract is(...other: unknown[]): boolean;
}