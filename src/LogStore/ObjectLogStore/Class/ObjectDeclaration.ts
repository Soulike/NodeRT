// DO NOT INSTRUMENT

import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {CallbackFunction} from '../../Class/CallbackFunction';
import {ObjectOperation} from './ObjectOperation';
import assert from 'assert';
import {isObject} from 'lodash';

export class ObjectDeclaration extends ResourceDeclaration
{
    private readonly objectWeakRef: WeakRef<object>;
    private readonly operations: Map<CallbackFunction, ObjectOperation[]>;

    constructor(object: object)
    {
        super();
        assert.ok(isObject(object));
        this.objectWeakRef = new WeakRef(object);
        this.operations = new Map();
    }

    public appendOperation(currentCallbackFunction: CallbackFunction, objectOperation: ObjectOperation): void
    {
        const operations = this.operations.get(currentCallbackFunction);
        if (operations === undefined)
        {
            this.operations.set(currentCallbackFunction, [objectOperation]);
        }
        else
        {
            operations.push(objectOperation);
        }
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
            objectWeakRef: objectType
        };
    }
}