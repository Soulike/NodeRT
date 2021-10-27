// DO NOT INSTRUMENT

import {Range} from './Range';

export class SourceCodeInfo
{
    public readonly file?: string;
    public readonly range?: Readonly<Range>;

    constructor()
    /**
     * @param file - code file path
     * @param range
     * */
    constructor(file: string, range: Readonly<Range>)
    constructor(file?: string, range?: Readonly<Range>)
    {
        this.file = file;
        this.range = Object.freeze(range);
    }

    public toJSON()
    {
        if (this.file && this.range)
        {
            const {startRow,startCol,endRow,endCol} = this.range;
            return `${this.file}:${startRow}:${startCol}:${endRow}:${endCol}`
        }
        else
        {
            return null;
        }
    }
}