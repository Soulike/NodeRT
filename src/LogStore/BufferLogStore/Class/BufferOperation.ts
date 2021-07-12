// DO NOT INSTRUMENT

import {ResourceOperation} from '../../../Analysis/Class/ResourceOperation';
import {SourceCodeInfo} from '../../../Analysis/Class/SourceCodeInfo';

export class BufferOperation extends ResourceOperation
{
    constructor(type: 'read' | 'write', sourceCodeInfo: SourceCodeInfo)
    {
        super(type, sourceCodeInfo);
    }
}