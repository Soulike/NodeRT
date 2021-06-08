import Scope from '../Class/Scope';
import {strict as assert} from 'assert';

class ScopeLogger
{
    private static scopeStack: Scope[] = [Scope.globalScope];

    public static pushScope(scope: Scope)
    {
        ScopeLogger.scopeStack.push(scope);
    }

    public static popScope()
    {
        ScopeLogger.scopeStack.length--;
    }

    public static getCurrentScope(): Scope
    {
        assert.ok(ScopeLogger.scopeStack.length > 0);
        return ScopeLogger.scopeStack[ScopeLogger.scopeStack.length - 1]!;
    }
}

export default ScopeLogger;