// DO NOT INSTRUMENT

import Analysis from '../../Type/Analysis';
import Sandbox from '../../Type/Sandbox';
import Hooks from '../../Type/Hooks';
import ArrayDeclaration from './Class/ArrayDeclaration';
import CallbackFunctionContext from '../Singleton/CallbackFunctionContext';
import ArrayOperation from './Class/ArrayOperation';
import {getSourceCodeInfoFromIid, toJSON} from '../Util';
import LastExpressionValueContainer from '../Singleton/LastExpressionValueContainer';

/**Does not support spread expression now*/
class ArrayAsyncRace extends Analysis
{
    public getField: Hooks['getField'] | undefined;
    public putFieldPre: Hooks['putFieldPre'] | undefined;
    public literal: Hooks['literal'] | undefined;
    public invokeFun: Hooks['invokeFun'] | undefined;
    public forObject: Hooks['forObject'] | undefined;

    private readonly arrayDeclarations: ArrayDeclaration[];

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.arrayDeclarations = [];

        this.registerHooks();

        process.on('exit', () => this.onAnalysisExit());
    }

    protected override registerHooks()
    {
        const sandbox = this.getSandbox();

        this.literal = (iid, val, fakeHasGetterSetter, literalType) =>
        {
            if (literalType === 'ArrayLiteral')
            {
                const newArrayDeclaration = new ArrayDeclaration(val as Array<unknown>);
                newArrayDeclaration.appendOperation(CallbackFunctionContext.getCurrentCallbackFunction(),
                    new ArrayOperation('write', getSourceCodeInfoFromIid(iid, sandbox)));
                this.arrayDeclarations.push(newArrayDeclaration);
            }
        };

        this.getField = (iid, base, offset, val, isComputed, isOpAssign, isMethodCall) =>
        {
            if (Array.isArray(base))
            {
                const arrayDeclaration = this.findOrAddArrayDeclaration(base as Array<unknown>);
                arrayDeclaration.appendOperation(CallbackFunctionContext.getCurrentCallbackFunction(),
                    new ArrayOperation('read', getSourceCodeInfoFromIid(iid, sandbox)));
            }
        };

        this.putFieldPre = (iid, base, offset, val, isComputed, isOpAssign) =>
        {
            if (Array.isArray(base))
            {
                const arrayDeclaration = this.findOrAddArrayDeclaration(base as Array<unknown>);
                arrayDeclaration.appendOperation(CallbackFunctionContext.getCurrentCallbackFunction(),
                    new ArrayOperation('write', getSourceCodeInfoFromIid(iid, sandbox)));
            }
        };

        this.invokeFun = (iid, f, base, args, result, isConstructor, isMethod) =>
        {
            const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);
            const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
            if (f === Array || f === Array.of)
            {
                const newArrayDeclaration = new ArrayDeclaration(result as Array<unknown>);
                newArrayDeclaration.appendOperation(currentCallbackFunction,
                    new ArrayOperation('write', sourceCodeInfo));
                this.arrayDeclarations.push(newArrayDeclaration);
            }
            else if (f === Array.from)
            {
                const iterable = args[0];
                if (Array.isArray(iterable))
                {
                    const arrayDeclaration = this.findOrAddArrayDeclaration(iterable);
                    arrayDeclaration.appendOperation(currentCallbackFunction,
                        new ArrayOperation('read', sourceCodeInfo));
                }
                const newArrayDeclaration = new ArrayDeclaration(result as Array<unknown>);
                newArrayDeclaration.appendOperation(currentCallbackFunction,
                    new ArrayOperation('write', sourceCodeInfo));
                this.arrayDeclarations.push(newArrayDeclaration);
            }
            else if (f === Array.prototype.concat)
            {
                const arg = args[0];
                const argArrayDeclaration = this.findOrAddArrayDeclaration(arg as unknown[]);
                argArrayDeclaration.appendOperation(currentCallbackFunction,
                    new ArrayOperation('read', sourceCodeInfo));

                const baseArrayDeclaration = this.findOrAddArrayDeclaration(base as unknown[]);
                baseArrayDeclaration.appendOperation(currentCallbackFunction,
                    new ArrayOperation('read', sourceCodeInfo));

                const resultNewArrayDeclaration = new ArrayDeclaration(result as Array<unknown>);
                resultNewArrayDeclaration.appendOperation(currentCallbackFunction,
                    new ArrayOperation('write', sourceCodeInfo));
                this.arrayDeclarations.push(resultNewArrayDeclaration);
            }
            else if (f === Array.prototype.copyWithin)
            {
                const arrayDeclaration = this.findOrAddArrayDeclaration(base as unknown[]);
                arrayDeclaration.appendOperation(currentCallbackFunction,
                    new ArrayOperation('read', sourceCodeInfo));
                arrayDeclaration.appendOperation(currentCallbackFunction,
                    new ArrayOperation('write', sourceCodeInfo));
            }
            else if (f === Array.prototype.entries || f === Array.prototype.keys || f === Array.prototype.values
                || f === Array.prototype.every || f === Array.prototype.find || f === Array.prototype.findIndex
                || f === Array.prototype.indexOf || f === Array.prototype.lastIndexOf
                || f === Array.prototype.forEach || f === Array.prototype.includes
                || f === Array.prototype.join || f === Array.prototype.reduce || f === Array.prototype.reduceRight
                || f === Array.prototype.some || f === Array.prototype.toString || f === Array.prototype.toLocaleString
            )
            {
                const arrayDeclaration = this.findOrAddArrayDeclaration(base as unknown[]);
                arrayDeclaration.appendOperation(currentCallbackFunction,
                    new ArrayOperation('read', sourceCodeInfo));
            }
            else if (f === Array.prototype.fill)
            {
                if (Array.isArray(base))
                {
                    const arrayDeclaration = this.findOrAddArrayDeclaration(base as unknown[]);
                    arrayDeclaration.appendOperation(currentCallbackFunction,
                        new ArrayOperation('write', sourceCodeInfo));
                }
            }
            else if (f === Array.prototype.pop || f === Array.prototype.push || f === Array.prototype.shift
                || f === Array.prototype.reverse || f === Array.prototype.sort || f === Array.prototype.unshift)
            {
                const arrayDeclaration = this.findOrAddArrayDeclaration(base as unknown[]);
                arrayDeclaration.appendOperation(currentCallbackFunction,
                    new ArrayOperation('write', sourceCodeInfo));
            }
            else if (f === Array.prototype.filter
                || f === Array.prototype.flat
                || f === Array.prototype.flatMap  // for performance, flat() is not precise, should be recursive
                || f === Array.prototype.map
                || f === Array.prototype.slice)
            {
                const baseArrayDeclaration = this.findOrAddArrayDeclaration(base as unknown[]);
                baseArrayDeclaration.appendOperation(currentCallbackFunction,
                    new ArrayOperation('read', sourceCodeInfo));

                const resultNewArrayDeclaration = new ArrayDeclaration(result as Array<unknown>);
                resultNewArrayDeclaration.appendOperation(currentCallbackFunction,
                    new ArrayOperation('write', sourceCodeInfo));
                this.arrayDeclarations.push(resultNewArrayDeclaration);
            }
            else if (f === Array.prototype.splice)
            {
                const baseArrayDeclaration = this.findOrAddArrayDeclaration(base as unknown[]);
                baseArrayDeclaration.appendOperation(currentCallbackFunction,
                    new ArrayOperation('write', sourceCodeInfo));

                const resultNewArrayDeclaration = new ArrayDeclaration(result as Array<unknown>);
                resultNewArrayDeclaration.appendOperation(currentCallbackFunction,
                    new ArrayOperation('write', sourceCodeInfo));
                this.arrayDeclarations.push(resultNewArrayDeclaration);
            }
        };


        this.forObject = (iid, isForIn) =>
        {
            const lastExpressionValue = LastExpressionValueContainer.getLastExpressionValue();
            if (!isForIn && Array.isArray(lastExpressionValue))
            {
                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);

                const arrayDeclaration = this.arrayDeclarations.find(arrayDeclaration => arrayDeclaration.is(lastExpressionValue));
                if (arrayDeclaration !== undefined)
                {
                    arrayDeclaration.appendOperation(CallbackFunctionContext.getCurrentCallbackFunction(), new ArrayOperation('read', sourceCodeInfo));
                }
                else
                {
                    const location = sandbox.iidToLocation(iid);
                    console.warn(`Warning: array ${lastExpressionValue} read at ${location} is not in 'arrayDeclarations'`);
                }
            }
        };
    }

    private findOrAddArrayDeclaration(array: ArrayDeclaration['array']): ArrayDeclaration
    {
        const arrayDeclaration = this.arrayDeclarations.find(
            arrayDeclaration => arrayDeclaration.is(array));
        if (arrayDeclaration === undefined)
        {
            const newArrayDeclaration = new ArrayDeclaration(array);
            this.arrayDeclarations.push(newArrayDeclaration);
            return newArrayDeclaration;
        }
        else
        {
            return arrayDeclaration;
        }
    }

    private onAnalysisExit()
    {
        console.log(toJSON(this.arrayDeclarations));
    }
}

export default ArrayAsyncRace;