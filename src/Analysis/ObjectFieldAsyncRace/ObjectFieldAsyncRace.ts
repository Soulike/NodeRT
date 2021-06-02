// DO NOT INSTRUMENT

import Sandbox from '../../Type/Sandbox';
import Hooks from '../../Type/Hooks';
import ObjectFieldDeclaration from './Class/ObjectFieldDeclaration';
import {getSourceCodeInfoFromIid, isObject, toJSON} from '../Util';
import SourceCodeInfo from '../Class/SourceCodeInfo';
import Range from '../Class/Range';
import ObjectFieldOperation from './Class/ObjectFieldOperation';
import CallbackFunctionContext from '../Singleton/CallbackFunctionContext';
import Analysis from '../../Type/Analysis';

class ObjectFieldAsyncRace extends Analysis
{
    public putFieldPre: Hooks['putFieldPre'] | undefined;
    public getField: Hooks['getField'] | undefined;
    public invokeFun: Hooks['invokeFun'] | undefined;
    public literal: Hooks['literal'] | undefined;

    private readonly objectFieldDeclarations: ObjectFieldDeclaration[];

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.objectFieldDeclarations = [];

        this.registerHooks();

        process.on('exit', () => this.onAnalysisExit());
    }

    protected override registerHooks()
    {
        this.literal = (iid, val, fakeHasGetterSetter, literalType) =>
        {
            if (literalType === 'ObjectLiteral')
            {
                const objectFieldDeclarations = this.getObjectFieldDeclarations(
                    val as { [key: string]: unknown },   // // restricted by isObject()
                    iid);
                this.objectFieldDeclarations.push(...objectFieldDeclarations);
            }
        };

        this.getField = (iid, base, offset, val, isComputed, isOpAssign, isMethodCall) =>
        {
            if (isObject(base))
            {
                const objectFieldDeclaration = this.findOrAddObjectFieldDeclaration(offset, base);
                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);

                const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                const newOperation = new ObjectFieldOperation('read', val, false, sourceCodeInfo);
                objectFieldDeclaration.appendOperation(currentCallbackFunction, newOperation);
            }
        };

        this.putFieldPre = (iid, base, offset, val, isComputed, isOpAssign) =>
        {
            if (isObject(base))
            {
                const objectFieldDeclaration = this.findOrAddObjectFieldDeclaration(offset, base);
                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);

                const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                const newOperation = new ObjectFieldOperation('write', val, false, sourceCodeInfo);
                objectFieldDeclaration.appendOperation(currentCallbackFunction, newOperation);
            }
        };

        this.invokeFun = (iid, f, base, args, result, isConstructor, isMethod, functionIid, functionSid) =>
        {
            const sandbox = this.getSandbox();
            const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);
            const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();

            if (f === Object.assign)
            {
                const [target, source] = args as [{ [key: string]: unknown }, { [key: string]: unknown }];
                const sourceKeys = Object.keys(source);
                sourceKeys.forEach(key =>
                {
                    const sourceFieldDeclaration = this.findOrAddObjectFieldDeclaration(key, source);
                    sourceFieldDeclaration.appendOperation(currentCallbackFunction, new ObjectFieldOperation('read', source[key], false, sourceCodeInfo));

                    const targetFieldDeclaration = this.findOrAddObjectFieldDeclaration(key, target);
                    targetFieldDeclaration.appendOperation(currentCallbackFunction, new ObjectFieldOperation('write', source[key], false, sourceCodeInfo));
                });
            }
            else if (f === Object.entries || f === Object.values)
            {
                const [object] = args as [{ [key: string]: unknown }];
                const keys = Object.keys(object);
                keys.forEach(key =>
                {
                    const fieldDeclaration = this.findOrAddObjectFieldDeclaration(key, object);
                    fieldDeclaration.appendOperation(currentCallbackFunction, new ObjectFieldOperation('read', object[key], false, sourceCodeInfo));
                });
            }
            else if (f === Object.create || ((f === Object || f === Function) && isConstructor))
            {
                const objectFieldDeclarations = this.getObjectFieldDeclarations(
                    result as { [key: string]: unknown },   // // restricted by isObject()
                    iid);
                this.objectFieldDeclarations.push(...objectFieldDeclarations);
            }
            else if (f === Object.defineProperty)
            {
                const object = args[0] as object;
                const key = args[1] as string;
                const value = args[2] as object;
                const fieldDeclaration = this.findOrAddObjectFieldDeclaration(key, object);
                fieldDeclaration.appendOperation(currentCallbackFunction, new ObjectFieldOperation('write', value, true, sourceCodeInfo));
            }
            else if (f === Object.defineProperties)
            {
                const object = args[0] as object;
                const props = args[1] as { [key: string]: unknown };
                Object.keys(props).forEach(key =>
                {
                    const fieldDeclaration = this.findOrAddObjectFieldDeclaration(key, object);
                    fieldDeclaration.appendOperation(currentCallbackFunction, new ObjectFieldOperation('write', props[key], true, sourceCodeInfo));
                });
            }
            else if (f === Object.getOwnPropertyDescriptor)
            {
                const object = args[0] as object;
                const key = args[1] as string;
                const fieldDeclaration = this.findOrAddObjectFieldDeclaration(key, object);
                fieldDeclaration.appendOperation(currentCallbackFunction, new ObjectFieldOperation('read', result, true, sourceCodeInfo));
            }
            else if (f === Object.getOwnPropertyDescriptors)
            {
                const object = args[0] as object;
                Object.keys(object).forEach(key =>
                {
                    const fieldDeclaration = this.findOrAddObjectFieldDeclaration(key, object);
                    fieldDeclaration.appendOperation(currentCallbackFunction, new ObjectFieldOperation('read',
                        (result as { [key: string]: object })[key], true, sourceCodeInfo));
                });
            }
        };
    }

    private onAnalysisExit()
    {
        console.log(toJSON(this.objectFieldDeclarations));
    }

    /**Recursively get all `ObjectFieldDeclaration` inside an object*/
    private getObjectFieldDeclarations(object: { [key: string]: unknown }, iid: number): ObjectFieldDeclaration[]
    {
        const objectFieldDeclarations: ObjectFieldDeclaration[] = [];
        const keys = Object.keys(object);
        keys.forEach(key =>
        {
            const value = object[key];
            const foundInObjectFieldDeclarations = this.objectFieldDeclarations.findIndex(
                objectFieldDeclaration => objectFieldDeclaration.is(key, object)) !== -1;
            if (!foundInObjectFieldDeclarations) // prevent circular reference
            {
                const sandbox = this.getSandbox();
                const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                const {
                    name: fileName,
                    range,
                } = sandbox.iidToSourceObject(iid);

                const sourceCodeInfo = new SourceCodeInfo(fileName, new Range(range[0], range[1]));
                const objectFieldDeclaration = new ObjectFieldDeclaration(key, object);
                objectFieldDeclaration.appendOperation(currentCallbackFunction, new ObjectFieldOperation('write', value, false, sourceCodeInfo));
                objectFieldDeclarations.push(objectFieldDeclaration);
            }

            if (isObject(value))
            {
                objectFieldDeclarations.push(...this.getObjectFieldDeclarations(
                    value as { [key: string]: unknown }, // restricted by isObject()
                    iid,
                ));
            }
        });
        return objectFieldDeclarations;
    }

    private findOrAddObjectFieldDeclaration(name: ObjectFieldDeclaration['name'], base: ObjectFieldDeclaration['base']): ObjectFieldDeclaration
    {
        const referenceFieldDeclaration = this.objectFieldDeclarations.find(
            referenceFieldDeclaration => referenceFieldDeclaration.is(name, base));
        if (referenceFieldDeclaration === undefined)
        {
            const newReferenceFieldDeclaration = new ObjectFieldDeclaration(name, base);
            this.objectFieldDeclarations.push(newReferenceFieldDeclaration);
            return newReferenceFieldDeclaration;
        }
        else
        {
            return referenceFieldDeclaration;
        }
    }
}

export default ObjectFieldAsyncRace;