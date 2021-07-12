// DO NOT INSTRUMENT

import {ResourceDeclaration} from '../../../Analysis/Class/ResourceDeclaration';
import {CallbackFunction} from '../../../Analysis/Class/CallbackFunction';
import {ResourceOperation} from '../../../Analysis/Class/ResourceOperation';
import {ArrayOperation} from './ArrayOperation';
import {strict as assert} from 'assert';

export class ArrayDeclaration extends ResourceDeclaration
{
    private readonly array: ReadonlyArray<unknown>;
    private readonly operations: Map<CallbackFunction, ArrayOperation[]>;

    constructor(array: ReadonlyArray<unknown>)
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