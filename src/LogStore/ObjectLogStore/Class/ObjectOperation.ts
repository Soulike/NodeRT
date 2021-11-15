// DO NOT INSTRUMENT

import { isPrimitive } from '../../../Util';
import { ResourceOperation } from '../../Class/ResourceOperation';
import { SourceCodeInfo } from '../../Class/SourceCodeInfo';
import { StatisticsStore } from '../../StatisticsStore';

export class ObjectOperation extends ResourceOperation
{
    public readonly fields: ReadonlySet<unknown>;

    constructor(type: 'read' | 'write', fields: ReadonlySet<unknown>, stackTrace: string[] | null, sourceCodeScopeInfo: SourceCodeInfo|null)
    {
        super(type, stackTrace, sourceCodeScopeInfo);
        this.fields = fields;
        StatisticsStore.addObjectOperationCount();
    }

    toJSON()
    {
        return {
            ...this,
            fields: Array.from(this.fields).map(field => isPrimitive(field) ? field : Object.prototype.toString.call(field)),
        };
    }
}