// DO NOT INSTRUMENT

import {ResourceOperation} from '../../../LogStore/Class/ResourceOperation';
import {SourceCodeInfo} from '../../../LogStore/Class/SourceCodeInfo';

export class ReferenceMetaOperation extends ResourceOperation
{
    constructor(type: 'read' | 'write', sourceCodeInfo: SourceCodeInfo)
    {
        super(type, sourceCodeInfo);
    }
}