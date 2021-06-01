// DO NOT INSTRUMENT

import CallbackFunction from '../Class/CallbackFunction';
import VariableDeclaration from './Class/VariableDeclaration';
import Hooks from '../../Type/Hooks';
import {toJSON} from '../Util';
import VariableOperation from './Class/VariableOperation';
import SourceCodeInfo from '../Class/SourceCodeInfo';
import Range from '../Class/Range';
import Sandbox from '../../Type/Sandbox';
import CallbackFunctionContext from '../Singleton/CallbackFunctionContext';
import Analysis from '../../Type/Analysis';

class PrimitiveAsyncRaceAnalysis extends Analysis
{
    public declare: Hooks['declare'] | undefined;
    public read: Hooks['read'] | undefined;
    public write: Hooks['write'] | undefined;

    private readonly variableDeclarations: VariableDeclaration[];

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.variableDeclarations = [];

        this.registerHooks();

        process.on('exit', () => this.onAnalysisExit());
    }

    private onAnalysisExit()
    {
        console.log(toJSON(this.variableDeclarations));
    }

    protected override registerHooks()
    {
        this.declare = (iid, name, type, kind) =>
        {
            if (type !== 'const')
            {
                const sandbox = this.getSandbox();
                const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                const {variableDeclarations} = this;
                const {
                    name: fileName,
                    range,
                } = sandbox.iidToSourceObject(iid);

                const scopeSourceCodeInfo = new SourceCodeInfo(fileName, new Range(range[0], range[1]));
                variableDeclarations.push(new VariableDeclaration(name, currentCallbackFunction, scopeSourceCodeInfo));
            }
        };

        this.read = (iid, name, val, isGlobal, isScriptLocal) =>
        {
            const sandbox = this.getSandbox();
            const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
            const {variableDeclarations} = this;
            const {
                name: fileName,
                range,
            } = sandbox.iidToSourceObject(iid);

            const sourceCodeInfo = new SourceCodeInfo(fileName, new Range(range[0], range[1]));
            if (isGlobal)
            {
                const declaration = new VariableDeclaration(name, CallbackFunction.GLOBAL, null);
                declaration.appendOperation(currentCallbackFunction, new VariableOperation('read', val, sourceCodeInfo));
                variableDeclarations.push(declaration);
            }
            else
            {
                let found = false;

                for (let i = variableDeclarations.length - 1; i >= 0; i--)
                {
                    const variableDeclaration = variableDeclarations[i]!;
                    if (variableDeclaration.name === name && currentCallbackFunction.isInAsyncScope(variableDeclaration.asyncScope))
                    {
                        const newOperation = new VariableOperation('read', val, sourceCodeInfo);
                        variableDeclaration.appendOperation(currentCallbackFunction, newOperation);
                        found = true;
                        break;
                    }
                }
                if (!found)
                {
                    const location = sandbox.iidToLocation(iid);
                    console.warn(`Warning: variable ${name} read at ${location} is not in 'variableDeclares'`);
                }
            }
        };

        this.write = (iid, name, val, lhs, isGlobal, isScriptLocal) =>
        {
            const sandbox = this.getSandbox();
            const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
            const {variableDeclarations} = this;
            const {
                name: fileName,
                range,
            } = sandbox.iidToSourceObject(iid);

            const sourceCodeInfo = new SourceCodeInfo(fileName, new Range(range[0], range[1]));
            if (isGlobal)
            {
                const declaration = new VariableDeclaration(name, CallbackFunction.GLOBAL, null);
                declaration.appendOperation(currentCallbackFunction, new VariableOperation('write', val, sourceCodeInfo));
                variableDeclarations.push(declaration);
            }
            else
            {
                let found = false;
                for (let i = this.variableDeclarations.length - 1; i >= 0; i--)
                {
                    const variableDeclaration = variableDeclarations[i]!;
                    if (variableDeclaration.name === name && currentCallbackFunction.isInAsyncScope(variableDeclaration.asyncScope))
                    {
                        const newOperation = new VariableOperation('write', val, sourceCodeInfo);
                        // append the operation to current callback
                        variableDeclaration.appendOperation(currentCallbackFunction, newOperation);
                        found = true;
                        break;
                    }
                }
                if (!found)
                {
                    const location = sandbox.iidToLocation(iid);
                    console.warn(`Warning: variable ${name} read at ${location} is not in 'variableDeclares'`);
                }
            }
        };
    }
}

export default PrimitiveAsyncRaceAnalysis;