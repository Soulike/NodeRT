// DO NOT INSTRUMENT

import ResourceDeclaration from '../../Class/ResourceDeclaration';
import CallbackFunction from '../../Class/CallbackFunction';
import ResourceOperation from '../../Class/ResourceOperation';
import ArrayOperation from './ArrayOperation';
import {strict as assert} from 'assert';

class ArrayDeclaration extends ResourceDeclaration
{
    private readonly array: unknown[];
    private readonly operations: Map<CallbackFunction, ArrayOperation[]>;

    constructor(array: unknown[])
    {
        super();
        assert.ok(Array.isArray(array));
        this.array = array;
        this.operations = new Map();
    }

    public appendOperation(currentCallbackFunction: CallbackFunction, arrayOperation: ArrayOperation): void
    {
        const operations = this.operations.get(currentCallbackFunction);
        if (operations === undefined)
        {
            this.operations.set(currentCallbackFunction, [arrayOperation]);
        }
        else
        {
            operations.push(arrayOperation);
        }
    }

    public getOperations(): Map<CallbackFunction, ResourceOperation[]>
    {
        return new Map(this.operations);
    }

    public is(other: unknown[]): boolean
    {
        return this.array === other;
    }

}

export default ArrayDeclaration;