// DO NOT INSTRUMENT

import {ResourceOperation} from '../../Class/ResourceOperation';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';

export class StreamOperation extends ResourceOperation
{
    constructor(type: 'read'|'write', sourceCodeInfo: SourceCodeInfo)
    {
        super(type, sourceCodeInfo);
    }
}