class Loc
{
    /**
     * @constructor
     *
     * @param {Position} start
     * @param {Position} end
     * */
    constructor(start, end)
    {
        this.start = start;
        this.end = end;
    }
}

module.exports = Loc;