// DO NOT INSTRUMENT

import Analysis from '../../Type/Analysis';
import Sandbox from '../../Type/Sandbox';
import Hooks from '../../Type/Hooks';
import ScopeLogger from '../Singleton/ScopeLogger';
import Scope from '../Class/Scope';
import FunctionDeclaration from '../Class/FunctionDeclaration';
import {strict as assert} from 'assert';
import VariableDeclaration from '../PrimitiveAsyncRace/Class/VariableDeclaration';
import CallbackFunctionContext from '../Singleton/CallbackFunctionContext';
import {getSourceCodeInfoFromIid, toJSON} from '../Util';
import VariableDeclarationLogger from '../Singleton/VariableDeclarationLogger';

class ScopeAnalysis extends Analysis
{
    public declare: Hooks['declare'] | undefined;
    public write: Hooks['write'] | undefined;
    public read: Hooks['read'] | undefined;
    public invokeFun: Hooks['invokeFun'] | undefined;
    public literal: Hooks['literal'] | undefined;
    public functionEnter: Hooks['functionEnter'] | undefined;
    public functionExit: Hooks['functionExit'] | undefined;

    private functionEnterTime: number;  // we need to ignore the first 2 functionEnters triggered by the runtime

    private lastDeclaredFunctionName: string | null;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.functionEnterTime = 0;
        this.lastDeclaredFunctionName = null;

        this.registerHooks();

        process.on('exit', () => this.onAnalysisExit());
    }

    protected override registerHooks(): void
    {
        this.read = (iid, name, val, isGlobal) =>
        {
            if (isGlobal)
            {
                if (Scope.globalScope.findVariableDeclaration(name) === null)
                {
                    const sandbox = this.getSandbox();
                    const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                    const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);
                    const variableDeclaration = new VariableDeclaration(name, currentCallbackFunction, Scope.globalScope, sourceCodeInfo);
                    VariableDeclarationLogger.addVariableDeclaration(variableDeclaration);
                    Scope.globalScope.addVariableDeclaration(variableDeclaration);
                }
                if ((typeof val === 'function' || val instanceof Function) && Scope.globalScope.findFunctionDeclaration(val) === null)
                {
                    const newFunctionScope = new Scope('function', Scope.globalScope);
                    const functionDeclaration = new FunctionDeclaration(val, newFunctionScope);
                    Scope.globalScope.addFunctionDeclaration(functionDeclaration);
                }
            }
        };

        this.write = (iid, name, val, lhs, isGlobal) =>
        {
            if (isGlobal)
            {
                if (Scope.globalScope.findVariableDeclaration(name) === null)
                {
                    const sandbox = this.getSandbox();
                    const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                    const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);
                    const variableDeclaration = new VariableDeclaration(name, currentCallbackFunction, Scope.globalScope, sourceCodeInfo);
                    VariableDeclarationLogger.addVariableDeclaration(variableDeclaration);
                    Scope.globalScope.addVariableDeclaration(variableDeclaration);
                }

                if ((typeof val === 'function' || val instanceof Function) && Scope.globalScope.findFunctionDeclaration(val) === null)
                {
                    const newFunctionScope = new Scope('function', Scope.globalScope);
                    const functionDeclaration = new FunctionDeclaration(val, newFunctionScope);
                    Scope.globalScope.addFunctionDeclaration(functionDeclaration);
                }
            }

            if ((typeof val === 'function' || val instanceof Function) && this.lastDeclaredFunctionName === name)  // variable initialization
            {
                this.lastDeclaredFunctionName = null;
                const lastFunctionScope = ScopeLogger.getLastFunctionScope();
                const newFunctionScope = new Scope('function', lastFunctionScope);
                const functionDeclaration = new FunctionDeclaration(val, newFunctionScope);
                lastFunctionScope.addFunctionDeclaration(functionDeclaration);
            }
        };

        // TODO: 解决在 functionEnter 之前被触发的 BUG
        this.declare = (iid, name, type, kind) =>
        {
            const sandbox = this.getSandbox();
            const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
            const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);
            if (type === 'let' || type === 'const')
            {
                const currentScope = ScopeLogger.getCurrentScope();
                const variableDeclaration = new VariableDeclaration(name, currentCallbackFunction, currentScope, sourceCodeInfo);
                VariableDeclarationLogger.addVariableDeclaration(variableDeclaration);
                currentScope.addVariableDeclaration(variableDeclaration);
            }
            else    // var
            {
                if (kind === 'FunctionDeclaration')
                {
                    assert.ok(this.lastDeclaredFunctionName === null);
                    this.lastDeclaredFunctionName = name;
                }

                const currentFunctionScope = ScopeLogger.getLastFunctionScope();
                const variableDeclaration = new VariableDeclaration(name, currentCallbackFunction, currentFunctionScope, sourceCodeInfo);
                VariableDeclarationLogger.addVariableDeclaration(variableDeclaration);
                currentFunctionScope.addVariableDeclaration(variableDeclaration);
            }
        };

        this.invokeFun = (iid, f, base, args, result, isConstructor, isMethod, functionIid, functionSid) =>
        {
            if (f === Function)
            {
                assert(typeof result === 'function' || result instanceof Function);
                const currentScope = ScopeLogger.getCurrentScope();
                const functionScope = new Scope('function', currentScope);
                const functionDeclaration = new FunctionDeclaration(result as Function, functionScope);
                currentScope.addFunctionDeclaration(functionDeclaration);
            }
        };

        this.literal = (iid, val, fakeHasGetterSetter, literalType) =>
        {
            if (literalType === 'FunctionLiteral')
            {
                assert.ok(typeof val === 'function');
                const currentScope = ScopeLogger.getCurrentScope();
                const functionScope = new Scope('function', currentScope);
                const functionDeclaration = new FunctionDeclaration(val, functionScope);
                currentScope.addFunctionDeclaration(functionDeclaration);
            }
        };

        this.registerFunctionScopeHooks();
        this.registerBlockScopeHooks();
    }

    private onAnalysisExit()
    {
        console.log(toJSON(VariableDeclarationLogger.getVariableDeclarationsClone()));
    }

    // TODO: async 函数实验
    private registerFunctionScopeHooks(): void
    {
        this.functionEnter = (iid, f, dis, args) =>
        {
            this.functionEnterTime++;
            if (this.functionEnterTime > 2)
            {
                const currentScope = ScopeLogger.getCurrentScope();
                const functionDeclaration = currentScope.findFunctionDeclaration(f);
                if (functionDeclaration === null)
                {
                    const sandbox = this.getSandbox();
                    const location = sandbox.iidToLocation(iid);
                    console.warn(`Warning: function ${f.name} called at ${location} is not logged`);
                }
                else
                {
                    ScopeLogger.pushScope(functionDeclaration.getScope());
                }
            }
            else if (this.functionEnterTime === 1)
            {
                ScopeLogger.pushScope(Scope.globalScope);   // init
            }
        };

        this.functionExit = (iid, returnVal, wrappedExceptionVal) =>
        {
            if (this.functionEnterTime > 2)
            {
                ScopeLogger.popScope();
            }
        };
    }

    private registerBlockScopeHooks(): void
    {
    }
}

export default ScopeAnalysis;