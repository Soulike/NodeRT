// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import ReferenceMetaDeclaration from './Class/ReferenceMetaDeclaration';
import ReferenceMetaOperation from './Class/ReferenceMetaOperation';
import {getSourceCodeInfoFromIid, isObject, isPrimitive, isReference, toJSON} from '../Util';
import CallbackFunctionContext from '../Singleton/CallbackFunctionContext';
import Reference from './Type/Reference';
import {strict as assert} from 'assert';

/**Focus on object (including Array & Function) descriptors and prototype*/
class ReferenceMetaOperationLogger extends Analysis
{
    public literal: Hooks['literal'] | undefined;
    public invokeFun: Hooks['invokeFun'] | undefined;

    private readonly referenceMetaDeclarations: ReferenceMetaDeclaration[];

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.referenceMetaDeclarations = [];

        this.registerHooks();

        process.on('exit', () => this.onAnalysisExit());
    }

    protected registerHooks()
    {
        this.literal = (iid, val, fakeHasGetterSetter, literalType) =>
        {
            if (literalType === 'ObjectLiteral' || literalType === 'ArrayLiteral')
            {
                assert.ok(isReference(val));
                const newReferenceMetaDeclaration = this.findOrAddObjectDeclaration(val as Reference);
                newReferenceMetaDeclaration.appendOperation(
                    CallbackFunctionContext.getCurrentCallbackFunction(),
                    new ReferenceMetaOperation('write', getSourceCodeInfoFromIid(iid, this.getSandbox())));
            }
        };

        this.invokeFun = (iid, f, base, args, result, isConstructor, isMethod, functionIid, functionSid) =>
        {
            if (f === Object)
            {
                if (isConstructor)
                {
                    assert.ok(isObject(result));
                    const referenceMetaDeclaration = this.findOrAddObjectDeclaration(result as object);
                    referenceMetaDeclaration.appendOperation(
                        CallbackFunctionContext.getCurrentCallbackFunction(),
                        new ReferenceMetaOperation('write', getSourceCodeInfoFromIid(iid, this.getSandbox())));
                }
                else
                {
                    const [arg] = args;
                    if (isPrimitive(arg))
                    {
                        assert.ok(isObject(result));
                        const referenceMetaDeclaration = this.findOrAddObjectDeclaration(result as object);
                        referenceMetaDeclaration.appendOperation(
                            CallbackFunctionContext.getCurrentCallbackFunction(),
                            new ReferenceMetaOperation('write', getSourceCodeInfoFromIid(iid, this.getSandbox())));
                    }
                }
            }
            else if (f === Function || f === Array || f === Object.create)
            {
                assert.ok(isReference(result));
                const referenceMetaDeclaration = this.findOrAddObjectDeclaration(result as Reference);
                referenceMetaDeclaration.appendOperation(
                    CallbackFunctionContext.getCurrentCallbackFunction(),
                    new ReferenceMetaOperation('write', getSourceCodeInfoFromIid(iid, this.getSandbox())));
            }
            else if (f === Object.freeze || f === Object.preventExtensions || f === Object.seal
                || f === Object.setPrototypeOf)
            {
                const [object] = args as [{ [key: string]: unknown }, ...unknown[]];
                assert.ok(isReference(object));
                const fieldDeclaration = this.findOrAddObjectDeclaration(object);
                fieldDeclaration.appendOperation(
                    CallbackFunctionContext.getCurrentCallbackFunction(),
                    new ReferenceMetaOperation('write', getSourceCodeInfoFromIid(iid, this.getSandbox())));
            }
            else if (f === Object.getPrototypeOf || f === Object.prototype.isPrototypeOf
                || f === Object.isExtensible || f === Object.isFrozen || f === Object.isSealed)
            {
                const [object] = args as [{ [key: string]: unknown }, ...unknown[]];
                assert.ok(isReference(object));
                const fieldDeclaration = this.findOrAddObjectDeclaration(object);
                fieldDeclaration.appendOperation(
                    CallbackFunctionContext.getCurrentCallbackFunction(),
                    new ReferenceMetaOperation('read', getSourceCodeInfoFromIid(iid, this.getSandbox())));
            }
        };
    }

    private onAnalysisExit()
    {
        console.log(toJSON(this.referenceMetaDeclarations));
    }

    private findOrAddObjectDeclaration(object: ReferenceMetaDeclaration['reference']): ReferenceMetaDeclaration
    {
        const referenceMetaDeclaration = this.referenceMetaDeclarations.find(
            referenceMetaDeclaration => referenceMetaDeclaration.is(object));
        if (referenceMetaDeclaration === undefined)
        {
            const newObjectDeclaration = new ReferenceMetaDeclaration(object);
            this.referenceMetaDeclarations.push(newObjectDeclaration);
            return newObjectDeclaration;
        }
        else
        {
            return referenceMetaDeclaration;
        }
    }
}

export default ReferenceMetaOperationLogger;