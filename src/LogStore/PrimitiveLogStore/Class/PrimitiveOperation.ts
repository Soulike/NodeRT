// DO NOT INSTRUMENT

import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {ResourceOperation} from '../../Class/ResourceOperation';
import {StatisticsStore} from '../../StatisticsStore';
import {isObject} from 'lodash';

export class PrimitiveOperation extends ResourceOperation
{
    public readonly value: unknown | WeakRef<any>;
    constructor(type: 'read' | 'write', value: unknown, stackTrace: string[] | null, sourceCodeScopeInfo: SourceCodeInfo)
    {
        super(type, stackTrace, sourceCodeScopeInfo);
        if (isObject(value))
        {
            this.value = new WeakRef(value);
        }
        else
        {
            this.value = value;
        }
        StatisticsStore.addPrimitiveOperationCount();
    }
}