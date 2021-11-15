// DO NOT INSTRUMENT

import {isPrimitive} from '../../../Util';
import {ResourceOperation} from '../../Class/ResourceOperation';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {StatisticsStore} from '../../StatisticsStore';
import assert from 'assert';

export class ObjectOperation extends ResourceOperation
{
    public readonly fields: ReadonlySet<unknown>;
    public readonly isConstruction: boolean;

    constructor(type: 'read' | 'write', fields: ReadonlySet<unknown>, isConstruction: boolean, stackTrace: string[] | null, sourceCodeScopeInfo: SourceCodeInfo | null)
    {
        super(type, stackTrace, sourceCodeScopeInfo);
        if (type === 'read')
        {
            assert.ok(!isConstruction);
        }
        this.fields = fields;
        this.isConstruction = isConstruction;
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