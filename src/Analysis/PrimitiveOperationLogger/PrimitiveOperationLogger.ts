// DO NOT INSTRUMENT

import {PrimitiveDeclaration} from './Class/PrimitiveDeclaration';
import {getSourceCodeInfoFromIid, toJSON} from '../../Util';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {Scope} from './Class/Scope';
import {strict as assert} from 'assert';
import {GLOBAL_IID} from './CONSTANT';
import {ScopeStack} from './Class/ScopeStack';
import {PrimitiveOperation} from './Class/PrimitiveOperation';
import {AsyncContextLogStore} from '../../LogStore/AsyncContextLogStore';

export class PrimitiveOperationLogger extends Analysis
{
    public declare: Hooks['declare'] | undefined;
    public functionEnter: Hooks['functionEnter'] | undefined;
    public functionExit: Hooks['functionExit'] | undefined;
    public literal: Hooks['literal'] | undefined;

    public read: Hooks['read'] | undefined;
    public write: Hooks['write'] | undefined;

    private readonly scopeStack: ScopeStack;
    private readonly pendingVariableDeclarations: PrimitiveDeclaration[];
    private readonly variableDeclarations: PrimitiveDeclaration[];

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.scopeStack = new ScopeStack();
        this.pendingVariableDeclarations = [];
        this.variableDeclarations = [];

        this.registerHooks();

        process.on('exit', () => this.onAnalysisExit());
    }

    protected override registerHooks()
    {
        this.literal = (iid, val, _fakeHasGetterSetter, literalType) =>
        {
            if (literalType === 'FunctionLiteral')
            {
                assert.ok(typeof val === 'function');
                const currentScope = this.scopeStack.getTop();
                assert.ok(currentScope !== undefined);

                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);

                const declaration = new PrimitiveDeclaration(iid, val.name, 'function', currentScope, sourceCodeInfo);
                this.variableDeclarations.push(declaration);
                currentScope.declarations.push(declaration);
            }
        };

        this.functionEnter = (iid) =>
        {
            if (iid === GLOBAL_IID)
            {
                for (const declaration of this.pendingVariableDeclarations)
                {
                    declaration.setScope(Scope.GLOBAL_SCOPE);
                }
                Scope.GLOBAL_SCOPE.declarations.push(...this.pendingVariableDeclarations);
                this.pendingVariableDeclarations.length = 0;
                this.scopeStack.push(Scope.GLOBAL_SCOPE);
            }
            else
            {
                let functionDeclaration: PrimitiveDeclaration | null = null;
                for (const declaration of this.variableDeclarations)
                {
                    if (declaration.type === 'function' && declaration.iid === iid)
                    {
                        functionDeclaration = declaration;
                        break;
                    }
                }
                assert.ok(functionDeclaration !== null);

                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);

                const newScope = new Scope('function', functionDeclaration.name, functionDeclaration.getScope(), [], sourceCodeInfo);
                for (const declaration of this.pendingVariableDeclarations)
                {
                    declaration.setScope(newScope);
                }
                newScope.declarations.push(...this.pendingVariableDeclarations);
                this.pendingVariableDeclarations.length = 0;
                this.scopeStack.push(newScope);
            }
        };

        this.functionExit = () =>
        {
            assert.ok(!this.scopeStack.isEmpty());
            const poppedScope = this.scopeStack.pop();
            assert.ok(poppedScope !== undefined);
            for (const declaration of this.pendingVariableDeclarations)
            {
                declaration.setScope(poppedScope);
            }
            poppedScope.declarations.push(...this.pendingVariableDeclarations);
            this.pendingVariableDeclarations.length = 0;
        };

        this.declare = (iid, name, _type, kind) =>
        {
            if (kind !== 'FunctionDeclaration')
            {
                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);

                const declaration = new PrimitiveDeclaration(iid, name, 'var', null, sourceCodeInfo);
                this.variableDeclarations.push(declaration);
                this.pendingVariableDeclarations.push(declaration);
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
    }

    private onAnalysisExit()
    {
        assert.ok(this.pendingVariableDeclarations.length === 0);
        console.log(toJSON(this.variableDeclarations));
    }

    private onVariableOperation(type: 'read' | 'write', iid: number, name: string, val: unknown, isGlobal: boolean)
    {
        const currentScope = this.scopeStack.getTop();
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
                newDeclaration.appendOperation(currentCallbackFunction, new PrimitiveOperation(type, val, sourceCodeInfo));
                this.variableDeclarations.push(newDeclaration);
                Scope.GLOBAL_SCOPE.declarations.push(newDeclaration);
            }
            else
            {
                let found = false;
                for (let i = this.pendingVariableDeclarations.length - 1; i >= 0; i--)
                {
                    const pendingDeclaration = this.pendingVariableDeclarations[i]!;
                    if (pendingDeclaration.name === name)
                    {
                        pendingDeclaration.appendOperation(currentCallbackFunction, new PrimitiveOperation(type, val, sourceCodeInfo));
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
            declaration.appendOperation(currentCallbackFunction, new PrimitiveOperation(type, val, sourceCodeInfo));
        }
    }
}