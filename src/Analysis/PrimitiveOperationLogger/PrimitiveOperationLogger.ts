// DO NOT INSTRUMENT

import {PrimitiveDeclaration, PrimitiveLogStore, PrimitiveOperation, Scope} from '../../LogStore/PrimitiveLogStore';
import {getSourceCodeInfoFromIid, parseErrorStackTrace} from '../../Util';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {strict as assert} from 'assert';
import {AsyncContextLogStore} from '../../LogStore/AsyncContextLogStore';
import {isFunction} from 'lodash';
import asyncHooks from 'async_hooks';
import {Queue} from '@datastructures-js/queue';

export class PrimitiveOperationLogger extends Analysis
{
    public declare: Hooks['declare'] | undefined;
    public functionEnter: Hooks['functionEnter'] | undefined;
    public functionExit: Hooks['functionExit'] | undefined;
    public literal: Hooks['literal'] | undefined;

    public read: Hooks['read'] | undefined;
    public write: Hooks['write'] | undefined;
    public awaitPre: Hooks['awaitPre'] | undefined;
    public awaitPost: Hooks['awaitPost'] | undefined;

    public endExecution: Hooks['endExecution'] | undefined;

    private readonly awaitIidToScopeQueue: Map<number, Queue<Scope>>;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.awaitIidToScopeQueue = new Map();

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.awaitPre = iid =>
        {
            const currentScope = PrimitiveLogStore.getScopeStack().getTop();
            assert.ok(currentScope !== undefined);
            const queue = this.awaitIidToScopeQueue.get(iid);
            if (queue === undefined)
            {
                this.awaitIidToScopeQueue.set(iid, new Queue<Scope>([currentScope]));
            }
            else
            {
                queue.enqueue(currentScope);
            }
        };

        /**
         * if encounters `awaitPost`, the scope now should be an old scope created before by an `await` function.
         * And `awaitPost` is invoked after `functionEnter`, which creates a new but wrong scope.
         * Therefore, delete the new scope and replace it with the correct scope where `await` happened in, which is logged in `awaitPre`
         *
         * Using a queue to log `await` with the same iids is not quite precise, but should be enough for analysis.
         * */
        this.awaitPost = iid =>
        {
            const scopeStack = PrimitiveLogStore.getScopeStack();
            assert.ok(!scopeStack.isEmpty());
            const poppedScope = scopeStack.pop();
            assert.ok(poppedScope !== undefined && poppedScope.declarations.length === 0);

            const scopeQueue = this.awaitIidToScopeQueue.get(iid);
            assert.ok(scopeQueue !== undefined);
            assert.ok(!scopeQueue.isEmpty());
            scopeStack.push(scopeQueue.dequeue());
        };

        this.literal = (iid, val, _fakeHasGetterSetter, literalType) =>
        {
            if (literalType === 'FunctionLiteral')
            {
                assert.ok(typeof val === 'function');
                const currentScope = PrimitiveLogStore.getScopeStack().getTop();
                assert.ok(currentScope !== undefined);

                const declaration = new PrimitiveDeclaration(iid, val.name, 'function', currentScope, val);

                // no need to add 'write' operation here since `this.write` hook will be called
                PrimitiveLogStore.addPrimitiveDeclaration(declaration);
                currentScope.declarations.push(declaration);
            }
        };

        this.functionEnter = (iid, f) =>
        {
            const functionDeclaration = PrimitiveLogStore.findFunctionDeclarationFromPrimitiveDeclarations(f);
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
            // Can't distinguish between normal declarations (var i) from parameters of functions. Should be a write operation to functions parameters when functions are called.
            if (kind !== 'FunctionDeclaration')
            {
                const declaration = new PrimitiveDeclaration(iid, name, 'var', null);
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
        const currentCallbackFunction = AsyncContextLogStore.getFunctionCallFromAsyncId(asyncHooks.executionAsyncId());

        if (declaration === null)
        {
            if (isGlobal)
            {
                let newDeclaration = null;
                if (isFunction(val))
                {
                    newDeclaration = new PrimitiveDeclaration(iid, name, 'function', Scope.GLOBAL_SCOPE, val);
                }
                else
                {
                    newDeclaration = new PrimitiveDeclaration(iid, name, 'var', Scope.GLOBAL_SCOPE);
                }

                newDeclaration.appendOperation(currentCallbackFunction, new PrimitiveOperation(type, parseErrorStackTrace(new Error().stack), sourceCodeInfo));
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
                        pendingDeclaration.appendOperation(currentCallbackFunction, new PrimitiveOperation(type, parseErrorStackTrace(new Error().stack), sourceCodeInfo));
                        found = true;
                        break;
                    }
                }

                if (!found)
                {
                    const location = sandbox.iidToLocation(iid);
                    console.warn(`(${type}) Declaration ${name} at ${location} are not logged.`);

                    // assume the declaration happened in current scope
                    let newDeclaration = null;
                    if (isFunction(val))
                    {
                        newDeclaration = new PrimitiveDeclaration(iid, name, 'function', currentScope, val);
                    }
                    else
                    {
                        newDeclaration = new PrimitiveDeclaration(iid, name, 'var', currentScope);
                    }

                    newDeclaration.appendOperation(currentCallbackFunction, new PrimitiveOperation(type, parseErrorStackTrace(new Error().stack), sourceCodeInfo));
                    PrimitiveLogStore.addPrimitiveDeclaration(newDeclaration);
                    currentScope.declarations.push(newDeclaration);
                }
            }
        }
        else
        {
            declaration.appendOperation(currentCallbackFunction, new PrimitiveOperation(type, parseErrorStackTrace(new Error().stack), sourceCodeInfo));
        }
    }
}