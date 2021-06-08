// DO NOT INSTRUMENT

import Hooks from '../../Type/Hooks';
import {getSourceCodeInfoFromIid} from '../Util';
import VariableOperation from './Class/VariableOperation';
import Sandbox from '../../Type/Sandbox';
import CallbackFunctionContext from '../Singleton/CallbackFunctionContext';
import Analysis from '../../Type/Analysis';
import ScopeLogger from '../Singleton/ScopeLogger';

class PrimitiveAsyncRaceAnalysis extends Analysis
{
    public read: Hooks['read'] | undefined;
    public write: Hooks['write'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.read = (iid, name, val, isGlobal, isScriptLocal) =>
        {
            const currentScope = ScopeLogger.getCurrentScope();
            const variableDeclaration = currentScope.findVariableDeclaration(name);
            const sandbox = this.getSandbox();
            if (variableDeclaration === null)
            {
                const location = sandbox.iidToLocation(iid);
                console.warn(`Warning: variable ${name} read at ${location} is not logged'`);
            }
            else
            {
                const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);
                variableDeclaration.appendOperation(currentCallbackFunction,
                    new VariableOperation('read', val, sourceCodeInfo));
            }
        };

        this.write = (iid, name, val, lhs, isGlobal, isScriptLocal) =>
        {
            const currentScope = ScopeLogger.getCurrentScope();
            const variableDeclaration = currentScope.findVariableDeclaration(name);
            const sandbox = this.getSandbox();
            if (variableDeclaration === null)
            {
                const location = sandbox.iidToLocation(iid);
                console.warn(`Warning: variable ${name} written at ${location} is not logged'`);
            }
            else
            {
                const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);
                variableDeclaration.appendOperation(currentCallbackFunction,
                    new VariableOperation('write', val, sourceCodeInfo));
            }
        };
    }
}

export default PrimitiveAsyncRaceAnalysis;