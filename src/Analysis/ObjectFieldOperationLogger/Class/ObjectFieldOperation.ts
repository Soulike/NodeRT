// DO NOT INSTRUMENT

import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {ResourceOperation} from '../../Class/ResourceOperation';

export class ObjectFieldOperation extends ResourceOperation
{
    public readonly value: unknown | PropertyDescriptor;
    /** The value is a property meta, e.g. `{value: 1, writable: false}` */
    public readonly isMeta: boolean;

    constructor(type: 'read' | 'write', value: unknown | PropertyDescriptor, isMeta: boolean, sourceCodeInfo: SourceCodeInfo)
    {
        super(type, sourceCodeInfo);
        this.value = value;
        this.isMeta = isMeta;
    }
}