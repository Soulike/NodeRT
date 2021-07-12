// DO NOT INSTRUMENT

import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {CallbackFunction} from '../../Class/CallbackFunction';
import {ReferenceMetaOperation} from './ReferenceMetaOperation';
import {Reference} from '../Type/Reference';

export class ReferenceMetaDeclaration extends ResourceDeclaration
{
    private readonly reference: Reference;
    private readonly operations: Map<CallbackFunction, ReferenceMetaOperation[]>;

    constructor(reference: Reference)
    {
        super();
        this.reference = reference;
        this.operations = new Map();
    }

    public is(other: Reference)
    {
        return other === this.reference;
    }

    public appendOperation(currentCallbackFunction: CallbackFunction, referenceMetaOperation: ReferenceMetaOperation): void
    {
        const referenceMetaOperations = this.operations.get(currentCallbackFunction);
        if (referenceMetaOperations === undefined)
        {
            this.operations.set(currentCallbackFunction, [referenceMetaOperation]);
        }
        else
        {
            referenceMetaOperations.push(referenceMetaOperation);
        }
    }

    public getOperations(): Map<CallbackFunction, ReferenceMetaOperation[]>
    {
        return new Map(this.operations);
    }

}