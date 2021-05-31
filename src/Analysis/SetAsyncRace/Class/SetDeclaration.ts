// DO NOT INSTRUMENT

import ResourceDeclaration from '../../Interface/ResourceDeclaration';
import CallbackFunction from '../../Class/CallbackFunction';
import SetOperation from './SetOperation';

class SetDeclaration implements ResourceDeclaration
{
    public readonly set: Set<unknown>;
    public readonly operations: Map<CallbackFunction, SetOperation[]>;

    constructor(set: Set<unknown>)
    {
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
}

export default SetDeclaration;