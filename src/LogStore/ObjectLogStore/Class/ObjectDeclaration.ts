// DO NOT INSTRUMENT

import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {CallbackFunction} from '../../Class/CallbackFunction';
import {ResourceOperation} from '../../Class/ResourceOperation';
import {ObjectOperation} from './ObjectOperation';

export class ObjectDeclaration extends ResourceDeclaration
{
    private readonly object: object;
    private readonly operations: Map<CallbackFunction, ObjectOperation[]>;

    constructor(object: object)
    {
        super();
        this.object = object;
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

    public getOperations(): Map<CallbackFunction, ResourceOperation[]>
    {
        return new Map(this.operations);
    }

    public is(other: unknown): boolean
    {
        return this.object === other;
    }

    public toJSON()
    {
        return {
            ...this,
            object: this.object === null ? null : `<Object>`,
        };
    }
}