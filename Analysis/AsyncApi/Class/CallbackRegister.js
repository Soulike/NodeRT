class CallbackRegister
{
    /**
     * @param {string} file - code file path
     * @param {Range} range
     * */
    constructor(file, range)
    {
        this.file = file;
        this.range = range;
    }
}

module.exports = CallbackRegister;