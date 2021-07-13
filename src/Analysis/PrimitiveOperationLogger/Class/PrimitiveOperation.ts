// DO NOT INSTRUMENT

import {SourceCodeInfo} from '../../../LogStore/Class/SourceCodeInfo';
import {ResourceOperation} from '../../../LogStore/Class/ResourceOperation';

export class PrimitiveOperation extends ResourceOperation
{
    public readonly value: unknown;

    constructor(type: 'read' | 'write', value: unknown, sourceCodeInfo: SourceCodeInfo)
    {
        super(type, sourceCodeInfo);
        this.value = value;
    }
}