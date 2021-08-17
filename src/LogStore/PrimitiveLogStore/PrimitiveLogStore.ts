// DO NOT INSTRUMENT

import {ScopeStack} from './Class/ScopeStack';
import {PrimitiveDeclaration} from './Class/PrimitiveDeclaration';
import {Scope} from './Class/Scope';

export class PrimitiveLogStore
{
    private static readonly scopeStack: ScopeStack = new ScopeStack();
    private static readonly pendingPrimitiveDeclarations: PrimitiveDeclaration[] = [];
    private static readonly primitiveDeclarations: PrimitiveDeclaration[] = [];

    public static getScopeStack(): ScopeStack
    {
        return this.scopeStack;
    }

    public static getPendingPrimitiveDeclarations(): ReadonlyArray<PrimitiveDeclaration>
    {
        return this.pendingPrimitiveDeclarations;
    }

    public static getPrimitiveDeclarations(): ReadonlyArray<PrimitiveDeclaration>
    {
        return this.primitiveDeclarations;
    }

    public static addPrimitiveDeclaration(primitiveDeclaration: PrimitiveDeclaration)
    {
        this.primitiveDeclarations.push(primitiveDeclaration);
    }

    public static addPendingPrimitiveDeclaration(primitiveDeclaration: PrimitiveDeclaration)
    {
        this.pendingPrimitiveDeclarations.push(primitiveDeclaration);
    }

    public static clearPendingPrimitiveDeclarations(scopeForPendingPrimitiveDeclarations: Scope)
    {
        for (const declaration of PrimitiveLogStore.pendingPrimitiveDeclarations)
        {
            declaration.setScope(scopeForPendingPrimitiveDeclarations);
        }
        scopeForPendingPrimitiveDeclarations.declarations.push(...PrimitiveLogStore.pendingPrimitiveDeclarations);
        PrimitiveLogStore.pendingPrimitiveDeclarations.length = 0;
    }

    public static findFunctionDeclarationFromPrimitiveDeclarations(func: Function): PrimitiveDeclaration | null
    {
        const functionDeclaration = PrimitiveLogStore.primitiveDeclarations
            .find(declaration => declaration.typeWhenDefined === 'function'
                && declaration.functionWhenDefinedWeakRef !== null
                && declaration.functionWhenDefinedWeakRef.deref() === func);
        return functionDeclaration === undefined ? null : functionDeclaration;
    }
}