// DO NOT INSTRUMENT

import Analysis from '../../Type/Analysis';
import Hooks from '../../Type/Hooks';
import Sandbox from '../../Type/Sandbox';
import ObjectDeclaration from './Class/ObjectDeclaration';
import ObjectOperation from './Class/ObjectOperation';
import {getSourceCodeInfoFromIid, isPrimitive, toJSON} from '../Util';
import CallbackFunctionContext from '../Singleton/CallbackFunctionContext';

/**Focus on object descriptors and prototype*/
class ObjectAsyncRace extends Analysis
{
    public literal: Hooks['literal'] | undefined;
    public invokeFun: Hooks['invokeFun'] | undefined;

    private readonly objectDeclarations: ObjectDeclaration[];

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.objectDeclarations = [];

        this.registerHooks();

        process.on('exit', () => this.onAnalysisExit());
    }

    protected registerHooks()
    {
        this.literal = (iid, val, fakeHasGetterSetter, literalType) =>
        {
            if (literalType === 'ObjectLiteral')
            {
                const newObjectDeclaration = this.findOrAddObjectDeclaration(val as object | Function);
                newObjectDeclaration.appendOperation(
                    CallbackFunctionContext.getCurrentCallbackFunction(),
                    new ObjectOperation('write', getSourceCodeInfoFromIid(iid, this.getSandbox())));
            }
        };

        this.invokeFun = (iid, f, base, args, result, isConstructor, isMethod, functionIid, functionSid) =>
        {
            if (f === Object)
            {
                if (isConstructor)
                {
                    const objectDeclaration = this.findOrAddObjectDeclaration(result as object);
                    objectDeclaration.appendOperation(
                        CallbackFunctionContext.getCurrentCallbackFunction(),
                        new ObjectOperation('write', getSourceCodeInfoFromIid(iid, this.getSandbox())));
                }
                else
                {
                    const [arg] = args;
                    if (isPrimitive(arg))
                    {
                        const objectDeclaration = this.findOrAddObjectDeclaration(result as object);
                        objectDeclaration.appendOperation(
                            CallbackFunctionContext.getCurrentCallbackFunction(),
                            new ObjectOperation('write', getSourceCodeInfoFromIid(iid, this.getSandbox())));
                    }
                }
            }
            else if (f === Function)
            {
                const objectDeclaration = this.findOrAddObjectDeclaration(result as Function);
                objectDeclaration.appendOperation(
                    CallbackFunctionContext.getCurrentCallbackFunction(),
                    new ObjectOperation('write', getSourceCodeInfoFromIid(iid, this.getSandbox())));
            }
            else if (f === Object.create)
            {
                const objectDeclaration = this.findOrAddObjectDeclaration(result as object);
                objectDeclaration.appendOperation(
                    CallbackFunctionContext.getCurrentCallbackFunction(),
                    new ObjectOperation('write', getSourceCodeInfoFromIid(iid, this.getSandbox())));
            }
            else if (f === Object.defineProperty || f === Object.defineProperties
                || f === Object.freeze || f === Object.preventExtensions || f === Object.seal
                || f === Object.setPrototypeOf)
            {
                const [object] = args as [{ [key: string]: unknown }, ...unknown[]];
                const fieldDeclaration = this.findOrAddObjectDeclaration(object);
                fieldDeclaration.appendOperation(
                    CallbackFunctionContext.getCurrentCallbackFunction(),
                    new ObjectOperation('write', getSourceCodeInfoFromIid(iid, this.getSandbox())));
            }
            else if (f === Object.getOwnPropertyDescriptor || f === Object.getOwnPropertyDescriptors || f === Object.getOwnPropertySymbols || f === Object.getPrototypeOf
                || f === Object.isExtensible || f === Object.isFrozen || f === Object.isSealed
                || f === Object.prototype.isPrototypeOf)
            {
                const [object] = args as [{ [key: string]: unknown }, ...unknown[]];
                const fieldDeclaration = this.findOrAddObjectDeclaration(object);
                fieldDeclaration.appendOperation(
                    CallbackFunctionContext.getCurrentCallbackFunction(),
                    new ObjectOperation('read', getSourceCodeInfoFromIid(iid, this.getSandbox())));
            }
        };
    }

    private onAnalysisExit()
    {
        console.log(toJSON(this.objectDeclarations));
    }

    private findOrAddObjectDeclaration(object: ObjectDeclaration['object']): ObjectDeclaration
    {
        const objectDeclaration = this.objectDeclarations.find(
            objectDeclaration => objectDeclaration.is(object));
        if (objectDeclaration === undefined)
        {
            const newObjectDeclaration = new ObjectDeclaration(object);
            this.objectDeclarations.push(newObjectDeclaration);
            return newObjectDeclaration;
        }
        else
        {
            return objectDeclaration;
        }
    }
}

export default ObjectAsyncRace;