// DO NOT INSTRUMENT
import Analysis from '../../Type/Analysis';
import Callback from './Class/Callback';
import VariableDeclare from './Class/VariableDeclare';
import Hooks from '../../Type/Hooks';
import {toJSON} from './Util';
import VariableOperation from './Class/VariableOperation';
import SourceCodeInfo from './Class/SourceCodeInfo';
import Range from './Class/Range';
import EventEmitter from 'events';
import Sandbox from '../../Type/Sandbox';

class AsyncApiAnalysis extends Analysis
{
    public declare: Hooks['declare'] | undefined;
    public read: Hooks['read'] | undefined;
    public write: Hooks['write'] | undefined;
    public getField: Hooks['getField'] | undefined;
    public putFieldPre: Hooks['putFieldPre'] | undefined;
    public functionEnter: Hooks['functionEnter'] | undefined;
    public invokeFunPre: Hooks['invokeFunPre'] | undefined;
    private currentCallback: Callback;
    private pendingCallbacks: Callback[]; // TODO: clean dead callbacks
    private readonly variableDeclares: VariableDeclare[];

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.currentCallback = new Callback(null, 'global', null, null);
        this.pendingCallbacks = [];
        this.variableDeclares = [];

        this.registerHooks();

        process.on('exit', () => this.onAnalysisExit());
    }

    private onAnalysisExit()
    {
        console.log(toJSON(this.variableDeclares));
    }

    private onCallbackExit()
    {
        // may be called again, put the callback back to `pendingCallbacks`
        if (this.currentCallback.type === 'interval' || this.currentCallback.type === 'eventListener')
        {
            const {
                func,
                type,
                scope,
                register,
            } = this.currentCallback;
            // Do not put reference back again. We need a new object to distinguish different calls
            this.pendingCallbacks.push(new Callback(func, type, scope, register));
        }
    }

    private registerHooks()
    {
        this.declare = (iid, name, type, kind) =>
        {
            const {currentCallback, variableDeclares} = this;
            variableDeclares.push(new VariableDeclare(name, currentCallback, null));
        };

        this.read = (iid, name, val, isGlobal, isScriptLocal) =>
        {
            const {currentCallback, variableDeclares} = this;
            for (let i = variableDeclares.length - 1; i >= 0; i--)
            {
                const variableDeclare = variableDeclares[i]!;
                if (variableDeclare.name === name)
                {
                    const newOperation = new VariableOperation('read', val);
                    const operationsOfCurrentCallback = variableDeclare.operations.get(currentCallback);
                    if (operationsOfCurrentCallback === undefined)
                    {
                        variableDeclare.operations.set(currentCallback, [newOperation]);
                    }
                    else
                    {
                        operationsOfCurrentCallback.push(newOperation);
                    }
                    break;
                }
            }
        };

        this.write = (iid, name, val, lhs, isGlobal, isScriptLocal) =>
        {
            const {currentCallback, variableDeclares} = this;
            if (isGlobal)
            {
                const declaration = new VariableDeclare(name, currentCallback, null);
                const newOperation = new VariableOperation('write', val);
                declaration.operations.set(currentCallback, [newOperation]);
            }
            else
            {
                for (let i = this.variableDeclares.length - 1; i >= 0; i--)
                {
                    const variableDeclare = variableDeclares[i]!;
                    if (variableDeclare.name === name)
                    {
                        const newOperation = new VariableOperation('write', val);
                        // append the operation to current callback
                        const operationsOfCurrentCallback = variableDeclare.operations.get(currentCallback);
                        if (operationsOfCurrentCallback === undefined)
                        {
                            variableDeclare.operations.set(currentCallback, [newOperation]);
                        }
                        else
                        {
                            operationsOfCurrentCallback.push(newOperation);
                        }
                        break;
                    }
                }
            }
        };

        this.getField = (iid, base, offset, val, isComputed, isOpAssign, isMethodCall) =>
        {
            const {currentCallback, variableDeclares} = this;
            for (let i = this.variableDeclares.length - 1; i >= -1; i--)
            {
                if (i === -1)   // not found in variableDeclares, newly created field
                {
                    const variableDeclare = new VariableDeclare(offset as string, currentCallback, base);
                    variableDeclare.operations.set(currentCallback, [
                        new VariableOperation('read', val),
                    ]);
                    variableDeclares.push(variableDeclare);
                    break;
                }

                const variableDeclare = variableDeclares[i]!;
                if (variableDeclare.name === offset && variableDeclare.base === base)
                {
                    const newOperation = new VariableOperation('read', val);
                    const operationsOfCurrentCallback = variableDeclare.operations.get(currentCallback);
                    if (operationsOfCurrentCallback === undefined)
                    {
                        variableDeclare.operations.set(currentCallback, [newOperation]);
                    }
                    else
                    {
                        operationsOfCurrentCallback.push(newOperation);
                    }
                    break;
                }
            }
        };

        this.putFieldPre = (iid, base, offset, val, isComputed, isOpAssign) =>
        {
            const {currentCallback, variableDeclares} = this;
            for (let i = variableDeclares.length - 1; i >= -1; i--)
            {
                if (i === -1)   // not found in variableDeclares, newly created field
                {
                    const variableDeclare = new VariableDeclare(offset as string, currentCallback, base);
                    variableDeclare.operations.set(currentCallback, [
                        new VariableOperation('write', val),
                    ]);
                    variableDeclares.push(variableDeclare);
                    break;
                }

                const variableDeclare = variableDeclares[i]!;
                if (variableDeclare.name === offset && variableDeclare.base === base)
                {
                    const newOperation = new VariableOperation('write', val);
                    // append the operation to current callback
                    const operationsOfCurrentCallback = variableDeclare.operations.get(currentCallback);
                    if (operationsOfCurrentCallback === undefined)
                    {
                        variableDeclare.operations.set(currentCallback, [newOperation]);
                    }
                    else
                    {
                        operationsOfCurrentCallback.push(newOperation);
                    }
                    break;
                }
            }
        };

        this.functionEnter = (iid, f, dis, args) =>
        {
            const pendingCallbacksCopy = Array.from(this.pendingCallbacks);
            for (let i = 0; i < pendingCallbacksCopy.length; i++)
            {
                const pendingCallback = pendingCallbacksCopy[i]!;
                if (pendingCallback.func === f)    // switch to the next pending callback
                {
                    this.onCallbackExit();
                    this.currentCallback = pendingCallback;
                    this.pendingCallbacks = [...this.pendingCallbacks.slice(0, i), ...this.pendingCallbacks.slice(i + 1)];
                    break;
                }
            }
        };

        this.invokeFunPre = (iid, f, base, args, isConstructor, isMethod, functionIid, functionSid) =>
        {
            const {currentCallback, pendingCallbacks} = this;
            const {
                name,
                range,
            } = this.sandbox.iidToSourceObject(iid);
            const register = new SourceCodeInfo(name, new Range(range[0], range[1]));
            if (f === setTimeout)
            {
                const callback = args[0] as Function;
                pendingCallbacks.push(new Callback(callback, 'timeout', currentCallback, register));
            }
            else if (f === setImmediate)
            {
                const callback = args[0] as Function;
                pendingCallbacks.push(new Callback(callback, 'immediate', currentCallback, register));
            }
            else if (f === setInterval)
            {
                const callback = args[0] as Function;
                pendingCallbacks.push(new Callback(callback, 'interval', currentCallback, register));
            }
            else if (f === process.nextTick)
            {
                const callback = args[0] as Function;
                pendingCallbacks.push(new Callback(callback, 'nextTick', currentCallback, register));
            }
            else if (f === Promise.prototype.then)
            {
                const resolve = args[0];
                const reject = args[1];
                if (typeof resolve === 'function')
                {
                    pendingCallbacks.push(new Callback(resolve, 'promiseThen', currentCallback, register));
                }
                if (typeof reject === 'function')
                {
                    pendingCallbacks.push(new Callback(reject, 'promiseThen', currentCallback, register));
                }
            }
            else if (f === Promise.prototype.catch || f === Promise.prototype.finally)
            {
                const callback = args[1];
                if (typeof callback === 'function')
                {
                    pendingCallbacks.push(new Callback(callback, 'promiseThen', currentCallback, register));
                }
            }
            else if (f === EventEmitter.prototype.on)
            {
                const callback = args[1] as Function;
                pendingCallbacks.push(new Callback(callback, 'eventListener', currentCallback, register));
            }
            else if (f === EventEmitter.prototype.once)
            {
                const callback = args[1] as Function;
                pendingCallbacks.push(new Callback(callback, 'eventListenerOnce', currentCallback, register));
            }
        };
    }
}

export default AsyncApiAnalysis;