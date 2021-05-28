// DO NOT INSTRUMENT
import Analysis from '../../Type/Analysis';
import CallbackFunction from './Class/CallbackFunction';
import VariableDeclaration from './Class/VariableDeclaration';
import Hooks from '../../Type/Hooks';
import {toJSON} from './Util';
import VariableOperation from './Class/VariableOperation';
import SourceCodeInfo from './Class/SourceCodeInfo';
import Range from './Class/Range';
import EventEmitter from 'events';
import Sandbox from '../../Type/Sandbox';

class PrimitiveAsyncRaceAnalysis extends Analysis
{
    public declare: Hooks['declare'] | undefined;
    public read: Hooks['read'] | undefined;
    public write: Hooks['write'] | undefined;
    public functionEnter: Hooks['functionEnter'] | undefined;
    public invokeFunPre: Hooks['invokeFunPre'] | undefined;

    private currentCallbackFunction: CallbackFunction;
    private pendingCallbackFunctions: CallbackFunction[]; // TODO: clean dead callbacks
    private readonly variableDeclarations: VariableDeclaration[];

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.currentCallbackFunction = CallbackFunction.GLOBAL;
        this.pendingCallbackFunctions = [];
        this.variableDeclarations = [];

        this.registerHooks();

        process.on('exit', () => this.onAnalysisExit());
    }

    private onAnalysisExit()
    {
        console.log(toJSON(this.variableDeclarations));
    }

    private onBeforeCurrentCallbackFunctionChanges()
    {
        // may be called again, put the callback back to `pendingCallbackFunctions`
        if (this.currentCallbackFunction.type === 'interval' || this.currentCallbackFunction.type === 'eventListener')
        {
            const {
                func,
                type,
                asyncScope,
                registerCodeInfo,
            } = this.currentCallbackFunction;
            // Do not put reference back again. We need a new object to distinguish different calls
            this.pendingCallbackFunctions.push(new CallbackFunction(func, type, asyncScope, registerCodeInfo));
        }
    }

    private registerHooks()
    {
        this.declare = (iid, name, type, kind) =>
        {
            const {currentCallbackFunction, variableDeclarations} = this;
            const {
                name: fileName,
                range,
            } = this.sandbox.iidToSourceObject(iid);

            const scopeSourceCodeInfo = new SourceCodeInfo(fileName, new Range(range[0], range[1]));
            variableDeclarations.push(new VariableDeclaration(name, currentCallbackFunction, scopeSourceCodeInfo));
        };

        // TODO: getField 和 putField 是否会在访问全局变量时也会被触发
        this.read = (iid, name, val, isGlobal, isScriptLocal) =>
        {
            const {currentCallbackFunction, variableDeclarations} = this;
            const {
                name: fileName,
                range,
            } = this.sandbox.iidToSourceObject(iid);

            const sourceCodeInfo = new SourceCodeInfo(fileName, new Range(range[0], range[1]));
            if (isGlobal)
            {
                const declaration = new VariableDeclaration(name, CallbackFunction.GLOBAL, null);
                declaration.operations.set(currentCallbackFunction, [new VariableOperation('read', val, sourceCodeInfo)]);
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
                        const operationsOfCurrentCallback = variableDeclaration.operations.get(currentCallbackFunction);
                        if (operationsOfCurrentCallback === undefined)
                        {
                            variableDeclaration.operations.set(currentCallbackFunction, [newOperation]);
                        }
                        else
                        {
                            operationsOfCurrentCallback.push(newOperation);
                        }
                        found = true;
                        break;
                    }
                }
                if (!found)
                {
                    const location = this.sandbox.iidToLocation(iid);
                    console.warn(`Warning: variable ${name} read at ${location} is not in 'variableDeclares'`);
                }
            }
        };

        this.write = (iid, name, val, lhs, isGlobal, isScriptLocal) =>
        {
            const {currentCallbackFunction, variableDeclarations} = this;
            const {
                name: fileName,
                range,
            } = this.sandbox.iidToSourceObject(iid);

            const sourceCodeInfo = new SourceCodeInfo(fileName, new Range(range[0], range[1]));
            if (isGlobal)
            {
                const declaration = new VariableDeclaration(name, CallbackFunction.GLOBAL, null);
                declaration.operations.set(currentCallbackFunction, [new VariableOperation('write', val, sourceCodeInfo)]);
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
                        const operationsOfCurrentCallback = variableDeclaration.operations.get(currentCallbackFunction);
                        if (operationsOfCurrentCallback === undefined)
                        {
                            variableDeclaration.operations.set(currentCallbackFunction, [newOperation]);
                        }
                        else
                        {
                            operationsOfCurrentCallback.push(newOperation);
                        }
                        found = true;
                        break;
                    }
                }
                if (!found)
                {
                    const location = this.sandbox.iidToLocation(iid);
                    console.warn(`Warning: variable ${name} read at ${location} is not in 'variableDeclares'`);
                }
            }
        };

        this.functionEnter = (iid, f, dis, args) =>
        {
            const pendingCallbackFunctionsCopy = Array.from(this.pendingCallbackFunctions);
            for (let i = pendingCallbackFunctionsCopy.length - 1; i >= 0; i--)
            {
                const pendingCallbackFunction = pendingCallbackFunctionsCopy[i]!;
                // actually its not precise here
                if (pendingCallbackFunction.func === f)    // switch to the next pending callback
                {
                    this.onBeforeCurrentCallbackFunctionChanges();
                    this.currentCallbackFunction = pendingCallbackFunction;
                    this.pendingCallbackFunctions = [...this.pendingCallbackFunctions.slice(0, i), ...this.pendingCallbackFunctions.slice(i + 1)];
                    break;
                }
            }
        };

        this.invokeFunPre = (iid, f, base, args, isConstructor, isMethod, functionIid, functionSid) =>
        {
            const {currentCallbackFunction, pendingCallbackFunctions} = this;
            const {
                name,
                range,
            } = this.sandbox.iidToSourceObject(iid);
            const register = new SourceCodeInfo(name, new Range(range[0], range[1]));
            if (f === setTimeout)
            {
                const callback = args[0] as Function;
                pendingCallbackFunctions.push(new CallbackFunction(callback, 'timeout', currentCallbackFunction, register));
            }
            else if (f === setImmediate)
            {
                const callback = args[0] as Function;
                pendingCallbackFunctions.push(new CallbackFunction(callback, 'immediate', currentCallbackFunction, register));
            }
            else if (f === setInterval)
            {
                const callback = args[0] as Function;
                pendingCallbackFunctions.push(new CallbackFunction(callback, 'interval', currentCallbackFunction, register));
            }
            else if (f === process.nextTick)
            {
                const callback = args[0] as Function;
                pendingCallbackFunctions.push(new CallbackFunction(callback, 'nextTick', currentCallbackFunction, register));
            }
            else if (f === Promise.prototype.then)
            {
                const resolve = args[0];
                const reject = args[1];
                if (typeof resolve === 'function')
                {
                    pendingCallbackFunctions.push(new CallbackFunction(resolve, 'promiseThen', currentCallbackFunction, register));
                }
                if (typeof reject === 'function')
                {
                    pendingCallbackFunctions.push(new CallbackFunction(reject, 'promiseThen', currentCallbackFunction, register));
                }
            }
            else if (f === Promise.prototype.catch || f === Promise.prototype.finally)
            {
                const callback = args[1];
                if (typeof callback === 'function')
                {
                    pendingCallbackFunctions.push(new CallbackFunction(callback, 'promiseThen', currentCallbackFunction, register));
                }
            }
            else if (f === EventEmitter.prototype.on)
            {
                const callback = args[1] as Function;
                pendingCallbackFunctions.push(new CallbackFunction(callback, 'eventListener', currentCallbackFunction, register));
            }
            else if (f === EventEmitter.prototype.once)
            {
                const callback = args[1] as Function;
                pendingCallbackFunctions.push(new CallbackFunction(callback, 'eventListenerOnce', currentCallbackFunction, register));
            }
        };
    }
}

export default PrimitiveAsyncRaceAnalysis;