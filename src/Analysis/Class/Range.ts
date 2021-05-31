// DO NOT INSTRUMENT

/**
 * Code range in a file
 * */
class Range
{
    public readonly start: number;
    public readonly end: number;

    /**
     * @param start - start position in file
     * @param end - end position in file
     * */
    constructor(start: number, end: number)
    {
        this.start = start;
        this.end = end;
    }
}

export default Range;