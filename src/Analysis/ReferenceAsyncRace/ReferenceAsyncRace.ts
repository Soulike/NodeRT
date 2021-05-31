// DO NOT INSTRUMENT

import Sandbox from '../../Type/Sandbox';
import Hooks from '../../Type/Hooks';
import ReferenceFieldDeclaration from './Class/ReferenceFieldDeclaration';
import {isReferenceType, toJSON} from '../Util';
import SourceCodeInfo from '../Class/SourceCodeInfo';
import Range from '../Class/Range';
import ReferenceFieldOperation from './Class/ReferenceFieldOperation';
import CallbackFunctionContext from '../Singleton/CallbackFunctionContext';
import Analysis from '../../Type/Analysis';

class ReferenceAsyncRace extends Analysis
{
    public write: Hooks['write'] | undefined;
    public putFieldPre: Hooks['putFieldPre'] | undefined;
    public getField: Hooks['getField'] | undefined;

    private readonly referenceFieldDeclarations: ReferenceFieldDeclaration[];

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.referenceFieldDeclarations = [];

        this.registerHooks();

        process.on('exit', () => this.onAnalysisExit());
    }

    protected override registerHooks()
    {
        this.write = (iid, name, val, lhs, isGlobal, isScriptLocal) =>
        {
            if (isReferenceType(val))
            {
                const referenceFieldDeclarations = this.getLiteralReferenceFieldDeclarations(
                    val as { [key: string]: unknown },   // // restricted by isReferenceType()
                    iid);
                this.referenceFieldDeclarations.push(...referenceFieldDeclarations);
            }
        };

        // TODO: 解决迭代器问题
        // TODO: 解决 Set 和 Map 等内置对象问题
        this.getField = (iid, base, offset, val, isComputed, isOpAssign, isMethodCall) =>
        {
            const referenceFieldDeclaration = this.findOrAddReferenceFieldDeclaration(offset, base);
            const sandbox = this.getSandbox();
            const {
                name: fileName,
                range,
            } = sandbox.iidToSourceObject(iid);

            const sourceCodeInfo = new SourceCodeInfo(fileName, new Range(range[0], range[1]));

            const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
            const newOperation = new ReferenceFieldOperation('read', val, sourceCodeInfo);
            const operations = referenceFieldDeclaration.operations.get(currentCallbackFunction);
            if (operations === undefined)
            {
                referenceFieldDeclaration.operations.set(currentCallbackFunction, [newOperation]);
            }
            else
            {
                operations.push(newOperation);
            }
        };

        this.putFieldPre = (iid, base, offset, val, isComputed, isOpAssign) =>
        {
            const referenceFieldDeclaration = this.findOrAddReferenceFieldDeclaration(offset, base);
            const sandbox = this.getSandbox();
            const {
                name: fileName,
                range,
            } = sandbox.iidToSourceObject(iid);

            const sourceCodeInfo = new SourceCodeInfo(fileName, new Range(range[0], range[1]));

            const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
            const newOperation = new ReferenceFieldOperation('write', val, sourceCodeInfo);
            const operations = referenceFieldDeclaration.operations.get(currentCallbackFunction);
            if (operations === undefined)
            {
                referenceFieldDeclaration.operations.set(currentCallbackFunction, [newOperation]);
            }
            else
            {
                operations.push(newOperation);
            }
        };
    }

    private onAnalysisExit()
    {
        console.log(toJSON(this.referenceFieldDeclarations));
    }

    private getLiteralReferenceFieldDeclarations(object: { [key: string]: unknown }, iid: number): ReferenceFieldDeclaration[]
    {
        const referenceFieldDeclarations: ReferenceFieldDeclaration[] = [];
        const keys = Object.keys(object);
        keys.forEach(key =>
        {
            const value = object[key];
            const foundInReferenceFieldDeclarations = this.referenceFieldDeclarations.findIndex(
                referenceFieldDeclaration => referenceFieldDeclaration.is(key, object)) !== -1;
            if (!foundInReferenceFieldDeclarations) // prevent circular reference
            {
                const sandbox = this.getSandbox();
                const currentCallbackFunction = CallbackFunctionContext.getCurrentCallbackFunction();
                const {
                    name: fileName,
                    range,
                } = sandbox.iidToSourceObject(iid);

                const sourceCodeInfo = new SourceCodeInfo(fileName, new Range(range[0], range[1]));
                const referenceFieldDeclaration = new ReferenceFieldDeclaration(key, object);
                referenceFieldDeclaration.operations.set(currentCallbackFunction, [new ReferenceFieldOperation('write', value, sourceCodeInfo)]);
                referenceFieldDeclarations.push(referenceFieldDeclaration);
            }

            if (isReferenceType(value))
            {
                referenceFieldDeclarations.push(...this.getLiteralReferenceFieldDeclarations(
                    value as { [key: string]: unknown }, // restricted by isReferenceType()
                    iid,
                ));
            }
        });
        return referenceFieldDeclarations;
    }

    private findOrAddReferenceFieldDeclaration(name: ReferenceFieldDeclaration['name'], base: ReferenceFieldDeclaration['base']): ReferenceFieldDeclaration
    {
        const referenceFieldDeclaration = this.referenceFieldDeclarations.find(
            referenceFieldDeclaration => referenceFieldDeclaration.is(name, base));
        if (referenceFieldDeclaration === undefined)
        {
            const newReferenceFieldDeclaration = new ReferenceFieldDeclaration(name, base);
            this.referenceFieldDeclarations.push(newReferenceFieldDeclaration);
            return newReferenceFieldDeclaration;
        }
        else
        {
            return referenceFieldDeclaration;
        }
    }
}

export default ReferenceAsyncRace;