class Position
{
    /**
     * @constructor
     *
     * @param {number} line
     * @param {number} column
     * */
    constructor(line, column)
    {
        this.line = line;
        this.column = column;
    }
}

module.exports = Position;