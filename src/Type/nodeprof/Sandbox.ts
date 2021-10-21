// DO NOT INSTRUMENT

import {SourceObject} from './SourceObject';
import {Analysis} from './Analysis';

export interface Sandbox
{
    analysis: Analysis;

    addAnalysis: (analysis: Analysis) => void;

    /**
     * Get the position string corresponding to iid
     *
     * @param iid - Static unique instruction identifier
     * @returns string - (filePath:startRow:startColumn:endRow:endColumn)
     * */
    iidToLocation: (iid: number) => `(${string}:${number}:${number}:${number}:${number})`;

    /**
     * Get the SourceObject corresponding to iid
     *
     * @param iid - Static unique instruction identifier
     * */
    iidToSourceObject: (iid: number) => SourceObject | void;

    /**
     * Get the code corresponding to iid
     *
     * @param iid - Static unique instruction identifier
     * @returns string - code corresponding to iid
     * */
    iidToCode: (iid: number) => string;
}