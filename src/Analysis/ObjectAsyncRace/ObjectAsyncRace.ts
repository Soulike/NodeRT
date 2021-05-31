// DO NOT INSTRUMENT

import Sandbox from '../../Type/Sandbox';
import Hooks from '../../Type/Hooks';
import ObjectFieldDeclaration from './Class/ObjectFieldDeclaration';
import {isObject, toJSON} from '../Util';
import SourceCodeInfo from '../Class/SourceCodeInfo';
import Range from '../Class/Range';
import ObjectFieldOperation from './Class/ObjectFieldOperation';
import CallbackFunctionContext from '../Singleton/CallbackFunctionContext';
import Analysis from '../../Type/Analysis';

class ObjectAsyncRace extends Analysis
{
    public write: Hooks['write'] | undefined;
    public putFieldPre: Hooks['putFieldPre'] | undefined;
    public getField: Hooks['getField'] | undefined;

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
        this.write = (iid, name, val, lhs, isGlobal, isScriptLocal) =>
        {
            if (isObject(val))
            {
                const objectFieldDeclarations = this.getObjectFieldDeclarations(
                    val as { [key: string]: unknown },   // // restricted by isObject()
                    iid);
                this.objectFieldDeclarations.push(...objectFieldDeclarations);
            }
        };

        // TODO: 内置 API
        this.getField = (iid, base, offset, val, isComputed, isOpAssign, isMethodCall) =>
        {
            if (isObject(base))
            {
                const objectFieldDeclaration = this.findOrAddObjectFieldDeclaration(offset, base);
                const sandbox = this.getSandbox();
                const {
                    name: fileName,
                    range,
                } = sandbox.iidToSourceObject(iid);

                const sourceCodeInfo = new SourceCodeInfo(fileName, new Range(range[0], range[1]));

                const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                const newOperation = new ObjectFieldOperation('read', val, sourceCodeInfo);
                const operations = objectFieldDeclaration.operations.get(currentCallbackFunction);
                if (operations === undefined)
                {
                    objectFieldDeclaration.operations.set(currentCallbackFunction, [newOperation]);
                }
                else
                {
                    operations.push(newOperation);
                }
            }
        };

        this.putFieldPre = (iid, base, offset, val, isComputed, isOpAssign) =>
        {
            if (isObject(base))
            {
                const objectFieldDeclaration = this.findOrAddObjectFieldDeclaration(offset, base);
                const sandbox = this.getSandbox();
                const {
                    name: fileName,
                    range,
                } = sandbox.iidToSourceObject(iid);

                const sourceCodeInfo = new SourceCodeInfo(fileName, new Range(range[0], range[1]));

                const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                const newOperation = new ObjectFieldOperation('write', val, sourceCodeInfo);
                const operations = objectFieldDeclaration.operations.get(currentCallbackFunction);
                if (operations === undefined)
                {
                    objectFieldDeclaration.operations.set(currentCallbackFunction, [newOperation]);
                }
                else
                {
                    operations.push(newOperation);
                }
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
                objectFieldDeclaration.operations.set(currentCallbackFunction, [new ObjectFieldOperation('write', value, sourceCodeInfo)]);
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

export default ObjectAsyncRace;