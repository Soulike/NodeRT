// DO NOT INSTRUMENT

import {SourceCodeInfo} from '../../../LogStore/Class/SourceCodeInfo';
import {ResourceOperation} from '../../../LogStore/Class/ResourceOperation';

export class SetOperation extends ResourceOperation
{
    constructor(type: 'read' | 'write', sourceCodeInfo: SourceCodeInfo)
    {
        super(type, sourceCodeInfo);
    }
}