/**
 * Code range in a file
 * */
class Range
{
    /**
     * @param {number} start - start position in file
     * @param {number} end - end position in file
     * */
    constructor(start, end)
    {
        this.start = start;
        this.end = end;
    }
}

module.exports = Range;