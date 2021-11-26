// DO NOT INSTRUMENT

import {isObject} from 'lodash';
import {ResourceOperation} from '../../Class/ResourceOperation';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {StatisticsStore} from '../../StatisticsStore';

export class PrimitiveOperation extends ResourceOperation
{
    public readonly valueBefore: unknown | WeakRef<any>;
    public readonly value: unknown | WeakRef<any>;
    public readonly isInitialization: boolean;

    constructor(type: 'read' | 'write', valueBefore: unknown, value: unknown, isInitialization: boolean, stackTrace: string[] | null, sourceCodeScopeInfo: SourceCodeInfo | null)
    {
        super(type, stackTrace, sourceCodeScopeInfo);
        this.valueBefore = isObject(valueBefore) ? new WeakRef(valueBefore) : valueBefore;
        this.value = isObject(value) ? new WeakRef(value) : value;
        this.isInitialization = isInitialization;
        StatisticsStore.addPrimitiveOperationCount();
    }
}