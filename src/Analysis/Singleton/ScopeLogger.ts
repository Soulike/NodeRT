// DO NOT INSTRUMENT

import Scope from '../Class/Scope';
import {strict as assert} from 'assert';

/**
 * Global shared static class that logs scope information.
 * Should only be written by <code>ScopeAnalysis</code>
 * */
class ScopeLogger
{
    private static scopeStack: Scope[] = [];

    public static pushScope(scope: Scope)
    {
        ScopeLogger.scopeStack.push(scope);
    }

    public static popScope()
    {
        ScopeLogger.scopeStack.length--;
        assert.ok(ScopeLogger.scopeStack.length >= 1);
    }

    public static getCurrentScope(): Scope
    {
        assert.ok(ScopeLogger.scopeStack.length > 0);
        return ScopeLogger.scopeStack[ScopeLogger.scopeStack.length - 1]!;
    }

    public static getLastFunctionScope(): Scope
    {
        let scope: Scope | null = ScopeLogger.getCurrentScope();

        while (scope !== null)
        {
            if (scope.getType() === 'function')
            {
                return scope;
            }
            else
            {
                scope = scope.getParentScope();
            }
        }

        return Scope.globalScope;
    }
}

export default ScopeLogger;