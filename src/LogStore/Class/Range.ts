// DO NOT INSTRUMENT

/**
 * Code range in a file
 * */
export class Range
{
    public readonly start: number;
    public readonly end: number;
    public readonly startRow: number;
    public readonly startCol: number;
    public readonly endRow: number;
    public readonly endCol: number;

    constructor(start: number, end: number, startRow: number, startCol: number, endRow: number, endCol: number)
    {
        this.start = start;
        this.end = end;
        this.startRow = startRow;
        this.startCol = startCol;
        this.endRow = endRow;
        this.endCol = endCol;
    }
}