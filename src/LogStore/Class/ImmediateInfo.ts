export class ImmediateInfo
{
    private static lastIndex = 0;
    public readonly callback: Function;
    public readonly index: number;

    constructor(callback: Function)
    {
        this.callback = callback;
        this.index = ImmediateInfo.lastIndex++;
    }
}