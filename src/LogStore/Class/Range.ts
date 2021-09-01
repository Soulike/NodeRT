// DO NOT INSTRUMENT

/**
 * Code range in a file
 * */
export class Range
{
    public readonly startRow: number;
    public readonly startCol: number;
    public readonly endRow: number;
    public readonly endCol: number;

    constructor(startRow: number, startCol: number, endRow: number, endCol: number)
    {
        this.startRow = startRow;
        this.startCol = startCol;
        this.endRow = endRow;
        this.endCol = endCol;
    }
}