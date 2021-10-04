import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {CallbackFunction} from '../../Class/CallbackFunction';
import {StaticPrimitiveOperation} from './StaticPrimitiveOperation';
import {strict as assert} from 'assert';

export class StaticPrimitiveDeclaration extends ResourceDeclaration
{
    public readonly iidWhenDefined: number;
    public readonly name: string;

    private readonly callbackFunctionToOperations: Map<CallbackFunction, StaticPrimitiveOperation[]>;

    constructor(iidWhenDefined: number, name: string)
    {
        super();
        this.iidWhenDefined = iidWhenDefined;
        assert.ok(name.length !== 0);   // should not make StaticPrimitiveDeclaration for anonymous variables
        this.name = name;
        this.callbackFunctionToOperations = new Map();
    }

    public override appendOperation(currentCallbackFunction: CallbackFunction, staticPrimitiveOperation: StaticPrimitiveOperation): void
    {
        const operations = (this.callbackFunctionToOperations.get(currentCallbackFunction) ?? []);
        operations.push(staticPrimitiveOperation);
        this.callbackFunctionToOperations.set(currentCallbackFunction, operations);
    }

    public override getCallbackFunctionToOperations(): ReadonlyMap<CallbackFunction, ReadonlyArray<StaticPrimitiveOperation>>
    {
        return this.callbackFunctionToOperations;
    }

    public override is(other: unknown): boolean
    {
        if (other instanceof StaticPrimitiveDeclaration)
        {
            return this.iidWhenDefined === other.iidWhenDefined && this.name === other.name;
        }
        else
        {
            return false;
        }
    }

}