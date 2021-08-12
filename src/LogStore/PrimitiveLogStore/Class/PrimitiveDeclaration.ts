// DO NOT INSTRUMENT

import {PrimitiveOperation} from './PrimitiveOperation';
import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {Scope} from './Scope';
import {CallbackFunction} from '../../Class/CallbackFunction';

export class PrimitiveDeclaration extends ResourceDeclaration
{
    public readonly iid: number;
    public readonly name: string;
    public readonly type: 'function' | 'var';

    private readonly callbackFunctionToOperations: Map<CallbackFunction, PrimitiveOperation[]>;
    private scope: Scope | null;    // null for pending ones

    constructor(iid: number, name: string, type: 'function' | 'var', scope: Scope | null)
    {
        super();
        this.iid = iid;
        this.name = name;
        this.type = type;
        this.scope = scope;
        this.callbackFunctionToOperations = new Map();
    }

    public getScope()
    {
        return this.scope;
    }

    public setScope(scope: Scope)
    {
        this.scope = scope;
    }

    public appendOperation(currentCallbackFunction: CallbackFunction, variableOperation: PrimitiveOperation): void
    {
        const operations = this.callbackFunctionToOperations.get(currentCallbackFunction);
        if (operations === undefined)
        {
            this.callbackFunctionToOperations.set(currentCallbackFunction, [variableOperation]);
        }
        else
        {
            operations.push(variableOperation);
        }
    }

    public getOperations(): ReadonlyMap<CallbackFunction, PrimitiveOperation[]>
    {
        return this.callbackFunctionToOperations;
    }

    public is(name: string): boolean
    {
        return name === this.name;
    }
}