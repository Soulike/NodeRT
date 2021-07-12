// DO NOT INSTRUMENT

export interface SourceObject
{
    /**Absolute path of source file*/
    readonly name: string,
    readonly internal: boolean,
    /**Character range in [start, end]*/
    readonly range: [number, number],
    /**Row & column range*/
    readonly loc: {
        readonly start: {
            readonly line: number,
            readonly column: number
        },
        readonly end: {
            readonly line: number,
            readonly column: number
        }
    }
}