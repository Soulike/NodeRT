// DO NOT INSTRUMENT

import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {ResourceOperation} from '../../Class/ResourceOperation';
import {StatisticsStore} from '../../StatisticsStore';
import {isObject} from 'lodash';

export class PrimitiveOperation extends ResourceOperation
{
    public readonly valueBefore: unknown | WeakRef<any>;
    public readonly value: unknown | WeakRef<any>;
    constructor(type: 'read' | 'write', valueBefore: unknown, value: unknown, stackTrace: string[] | null, sourceCodeScopeInfo: SourceCodeInfo)
    {
        super(type, stackTrace, sourceCodeScopeInfo);
        this.valueBefore = isObject(valueBefore) ? new WeakRef(valueBefore) : valueBefore;
        this.value = isObject(value) ? new WeakRef(value) : value;
        StatisticsStore.addPrimitiveOperationCount();
    }
}