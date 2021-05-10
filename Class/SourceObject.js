/**
 * @description Corresponding to iidToSourceObject()
 * */
class SourceObject
{
    /**
     * @class
     *
     * @param {string} name Absolute path of file
     * @param {boolean} internal
     * @param {[number, number]} range Range in char numbers, [start, end]
     * @param {Loc} loc Range in line & column numbers
     * */
    constructor(name, internal, range, loc)
    {
        this.name = name;
        this.internal = internal;
        this.range = range;
        this.loc = loc;
    }
}

module.exports = SourceObject;