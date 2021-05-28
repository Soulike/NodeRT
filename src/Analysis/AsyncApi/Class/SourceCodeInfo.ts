// DO NOT INSTRUMENT
import Range from './Range';

class SourceCodeInfo
{
    public readonly file: string;
    public readonly range: Readonly<Range>;

    /**
     * @param file - code file path
     * @param range
     * */
    constructor(file: string, range: Readonly<Range>)
    {
        this.file = file;
        this.range = Object.freeze(range);
    }
}

export default SourceCodeInfo;