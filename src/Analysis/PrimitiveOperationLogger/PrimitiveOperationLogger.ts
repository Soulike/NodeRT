// DO NOT INSTRUMENT

import {PrimitiveDeclaration, PrimitiveLogStore, PrimitiveOperation, Scope} from '../../LogStore/PrimitiveLogStore';
import {getSourceCodeInfoFromIid} from '../../Util';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {strict as assert} from 'assert';
import {AsyncContextLogStore} from '../../LogStore/AsyncContextLogStore';

export class PrimitiveOperationLogger extends Analysis
{
    public declare: Hooks['declare'] | undefined;
    public functionEnter: Hooks['functionEnter'] | undefined;
    public functionExit: Hooks['functionExit'] | undefined;
    public literal: Hooks['literal'] | undefined;

    public read: Hooks['read'] | undefined;
    public write: Hooks['write'] | undefined;

    public endExecution: Hooks['endExecution'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.literal = (iid, val, _fakeHasGetterSetter, literalType) =>
        {
            if (literalType === 'FunctionLiteral')
            {
                assert.ok(typeof val === 'function');
                const currentScope = PrimitiveLogStore.getScopeStack().getTop();
                assert.ok(currentScope !== undefined);

                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);

                const declaration = new PrimitiveDeclaration(iid, val.name, 'function', currentScope, sourceCodeInfo);
                PrimitiveLogStore.addPrimitiveDeclaration(declaration);
                currentScope.declarations.push(declaration);
            }
        };

        this.functionEnter = (iid) =>
        {
            const functionDeclaration = PrimitiveLogStore.findFunctionDeclarationFromPrimitiveDeclarations(iid);
            if (functionDeclaration === null)
            {
                PrimitiveLogStore.clearPendingPrimitiveDeclarations(Scope.GLOBAL_SCOPE);
                PrimitiveLogStore.getScopeStack().push(Scope.GLOBAL_SCOPE);
            }
            else
            {
                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);

                const newScope = new Scope('function', functionDeclaration.name, functionDeclaration.getScope(), [], sourceCodeInfo);
                PrimitiveLogStore.clearPendingPrimitiveDeclarations(newScope);
                PrimitiveLogStore.getScopeStack().push(newScope);
            }
        };

        this.functionExit = () =>
        {
            const scopeStack = PrimitiveLogStore.getScopeStack();
            assert.ok(!scopeStack.isEmpty());
            const poppedScope = scopeStack.pop();
            assert.ok(poppedScope !== undefined);
            PrimitiveLogStore.clearPendingPrimitiveDeclarations(poppedScope);
        };

        this.declare = (iid, name, _type, kind) =>
        {
            if (kind !== 'FunctionDeclaration')
            {
                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);

                const declaration = new PrimitiveDeclaration(iid, name, 'var', null, sourceCodeInfo);
                PrimitiveLogStore.addPrimitiveDeclaration(declaration);
                PrimitiveLogStore.addPendingPrimitiveDeclaration(declaration);
            }
        };

        this.read = (iid, name, val, isGlobal) =>
        {
            this.onVariableOperation('read', iid, name, val, isGlobal);
        };

        this.write = (iid, name, val, _lhs, isGlobal) =>
        {
            this.onVariableOperation('write', iid, name, val, isGlobal);
        };

        this.endExecution = () =>
        {
            assert.ok(PrimitiveLogStore.getPendingPrimitiveDeclarations().length === 0);
        };
    }

    private onVariableOperation(type: 'read' | 'write', iid: number, name: string, val: unknown, isGlobal: boolean)
    {
        if (name === 'this')
        {
            return;
        }

        const currentScope = PrimitiveLogStore.getScopeStack().getTop();
        assert.ok(currentScope !== undefined);
        const sandbox = this.getSandbox();
        const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);
        const declaration = currentScope.getDeclarationByName(name);
        const currentCallbackFunction = AsyncContextLogStore.getCurrentCallbackFunction();

        if (declaration === null)
        {
            if (isGlobal)
            {
                const newDeclaration = new PrimitiveDeclaration(iid, name, typeof val === 'function' ? 'function' : 'var', Scope.GLOBAL_SCOPE, sourceCodeInfo);
                newDeclaration.appendOperation(currentCallbackFunction, new PrimitiveOperation(type, sourceCodeInfo));
                PrimitiveLogStore.addPrimitiveDeclaration(newDeclaration);
                Scope.GLOBAL_SCOPE.declarations.push(newDeclaration);
            }
            else
            {
                let found = false;
                const pendingPrimitiveDeclarations = PrimitiveLogStore.getPendingPrimitiveDeclarations();
                for (let i = pendingPrimitiveDeclarations.length - 1; i >= 0; i--)
                {
                    const pendingDeclaration = pendingPrimitiveDeclarations[i]!;
                    if (pendingDeclaration.name === name)
                    {
                        pendingDeclaration.appendOperation(currentCallbackFunction, new PrimitiveOperation(type, sourceCodeInfo));
                        found = true;
                        break;
                    }
                }

                if (!found)
                {
                    const location = sandbox.iidToLocation(iid);
                    console.warn(`(${type}) Declaration ${name} at ${location} are not logged.`);
                }
            }
        }
        else
        {
            declaration.appendOperation(currentCallbackFunction, new PrimitiveOperation(type, sourceCodeInfo));
        }
    }
}