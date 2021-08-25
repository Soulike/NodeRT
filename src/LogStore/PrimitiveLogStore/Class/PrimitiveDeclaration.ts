// DO NOT INSTRUMENT

import {PrimitiveOperation} from './PrimitiveOperation';
import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {Scope} from './Scope';
import {CallbackFunction} from '../../Class/CallbackFunction';
import {isFunction} from 'lodash';

export class PrimitiveDeclaration extends ResourceDeclaration
{
    public readonly iid: number;
    public readonly name: string;
    public readonly typeWhenDefined: 'function' | 'var';

    /** used for finding correct function call */
    public readonly functionWhenDefinedWeakRef: WeakRef<Function> | null;

    private readonly callbackFunctionToOperations: Map<CallbackFunction, PrimitiveOperation[]>;
    private scope: Scope | null;    // null for pending ones

    constructor(iid: number, name: string, typeWhenDefined: 'function', scope: Scope | null, func: Function)
    constructor(iid: number, name: string, typeWhenDefined: 'var', scope: Scope | null)
    constructor(iid: number, name: string, typeWhenDefined: 'function' | 'var', scope: Scope | null, func?: Function)
    {
        super();
        this.iid = iid;
        this.name = name;
        this.typeWhenDefined = typeWhenDefined;
        this.scope = scope;
        this.callbackFunctionToOperations = new Map();

        if (typeWhenDefined === 'function' && isFunction(func))
        {
            this.functionWhenDefinedWeakRef = new WeakRef(func);
        }
        else
        {
            this.functionWhenDefinedWeakRef = null;
        }
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

    public getCallbackFunctionToOperations(): ReadonlyMap<CallbackFunction, PrimitiveOperation[]>
    {
        return this.callbackFunctionToOperations;
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