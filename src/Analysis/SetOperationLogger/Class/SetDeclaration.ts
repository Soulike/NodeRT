// DO NOT INSTRUMENT

import {CallbackFunction} from '../../Class/CallbackFunction';
import {SetOperation} from './SetOperation';
import {ResourceDeclaration} from '../../Class/ResourceDeclaration';

export class SetDeclaration extends ResourceDeclaration
{
    public readonly set: Set<unknown>;
    public readonly operations: Map<CallbackFunction, SetOperation[]>;

    constructor(set: Set<unknown>)
    {
        super();
        this.set = set;
        this.operations = new Map();
    }

    public is(other: Set<unknown>): boolean
    {
        return this.set === other;
    }

    public appendOperation(currentCallbackFunction: CallbackFunction, setOperation: SetOperation)
    {
        const setOperations = this.operations.get(currentCallbackFunction);
        if (setOperations === undefined)
        {
            this.operations.set(currentCallbackFunction, [setOperation]);
        }
        else
        {
            setOperations.push(setOperation);
        }
    }

    public getOperations(): Map<CallbackFunction, SetOperation[]>
    {
        return new Map(this.operations);
    }
}