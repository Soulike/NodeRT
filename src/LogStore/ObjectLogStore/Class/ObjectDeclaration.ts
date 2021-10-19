// DO NOT INSTRUMENT

import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {AsyncCalledFunctionInfo} from '../../Class/AsyncCalledFunctionInfo';
import {ObjectOperation} from './ObjectOperation';
import assert from 'assert';
import {isObject} from 'lodash';
import {RaceDetector} from '../../../RaceDetector';
import {StatisticsStore} from '../../StatisticsStore';

export class ObjectDeclaration extends ResourceDeclaration
{
    private readonly objectWeakRef: WeakRef<object>;
    private readonly asyncContextToOperations: Map<AsyncCalledFunctionInfo, ObjectOperation[]>;

    constructor(object: object)
    {
        super();
        assert.ok(isObject(object));
        this.objectWeakRef = new WeakRef(object);
        this.asyncContextToOperations = new Map();
        StatisticsStore.addObjectCount();
    }

    public appendOperation(currentCallbackFunction: AsyncCalledFunctionInfo, objectOperation: ObjectOperation): void
    {
        const operations = this.asyncContextToOperations.get(currentCallbackFunction);
        if (operations === undefined)
        {
            this.asyncContextToOperations.set(currentCallbackFunction, [objectOperation]);
        }
        else
        {
            operations.push(objectOperation);
        }
        RaceDetector.emit('operationAppended', this);
    }

    public getAsyncContextToOperations(): ReadonlyMap<AsyncCalledFunctionInfo, ObjectOperation[]>
    {
        return this.asyncContextToOperations;
    }

    public is(other: unknown): boolean
    {
        return this.objectWeakRef.deref() === other;
    }

    public toJSON()
    {
        const object = this.objectWeakRef.deref();
        let objectType = object === undefined
            ? '[ReleasedObject]'
            : `${Object.prototype.toString.apply(object)}`;
        return {
            ...this,
            objectWeakRef: objectType,
        };
    }
}