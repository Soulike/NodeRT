// DO NOT INSTRUMENT

import {ResourceOperation} from '../../Class/ResourceOperation';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';

export class SocketOperation extends ResourceOperation
{
    constructor(sourceCodeInfo: SourceCodeInfo)
    {
        // only write for socket
        super('write', sourceCodeInfo);
    }
}