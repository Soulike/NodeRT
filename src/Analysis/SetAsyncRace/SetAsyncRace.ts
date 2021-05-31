// DO NOT INSTRUMENT

import Analysis from '../../Type/Analysis';
import Hooks from '../../Type/Hooks';
import Sandbox from '../../Type/Sandbox';
import SetDeclaration from './Class/SetDeclaration';
import SetOperation from './Class/SetOperation';
import SourceCodeInfo from '../Class/SourceCodeInfo';
import Range from '../Class/Range';
import CallbackFunctionContext from '../Singleton/CallbackFunctionContext';
import {toJSON} from '../Util';

class SetAsyncRace extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public endExpression: Hooks['endExpression'] | undefined;
    public forObject: Hooks['forObject'] | undefined;

    private readonly setDeclarations: SetDeclaration[];
    private lastExpressionValue: unknown;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.setDeclarations = [];
        this.lastExpressionValue = null;

        this.registerHooks();

        process.on('exit', () => this.onAnalysisExit());
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, base, args, result, isConstructor, isMethod) =>
        {
            const readMethods: Function[] = [Set.prototype.entries, Set.prototype.forEach, Set.prototype.has, Set.prototype.keys, Set.prototype.values, Set.prototype[Symbol.iterator]];
            const writeMethods: Function[] = [Set.prototype.add, Set.prototype.delete, Set.prototype.clear];
            if (f === Set && isConstructor)
            {
                const setDeclaration = new SetDeclaration(result as Set<unknown>);
                this.setDeclarations.push(setDeclaration);
            }
            else if (base instanceof Set)
            {
                const sandbox = this.getSandbox();
                const {
                    name: fileName,
                    range,
                } = sandbox.iidToSourceObject(iid);

                const sourceCodeInfo = new SourceCodeInfo(fileName, new Range(range[0], range[1]));

                let type: 'write' | 'read' | 'unknown' = 'unknown';

                if (readMethods.includes(f))
                {
                    type = 'read';
                }
                else if (writeMethods.includes(f))
                {
                    type = 'write';
                }

                if (type !== 'unknown')
                {
                    const setDeclaration = this.setDeclarations.find(setDeclaration => setDeclaration.is(base));
                    if (setDeclaration !== undefined)
                    {
                        setDeclaration.appendOperation(CallbackFunctionContext.getCurrentCallbackFunction(), new SetOperation(type, sourceCodeInfo));
                    }
                    else
                    {
                        const location = sandbox.iidToLocation(iid);
                        console.warn(`Warning: set ${base} ${type === 'read' ? 'read' : 'written'} at ${location} is not in 'setDeclarations'`);
                    }
                }
                else
                {
                    console.warn(`Warning: set ${base} is performed unknown method at ${location}`);
                }
            }
        };

        this.endExpression = (iid, type, value) =>
        {
            this.lastExpressionValue = value;
        };

        this.forObject = (iid, isForIn) =>
        {
            const {lastExpressionValue} = this;
            if (!isForIn && lastExpressionValue instanceof Set)
            {
                const sandbox = this.getSandbox();
                const {
                    name: fileName,
                    range,
                } = sandbox.iidToSourceObject(iid);

                const sourceCodeInfo = new SourceCodeInfo(fileName, new Range(range[0], range[1]));

                const setDeclaration = this.setDeclarations.find(setDeclaration => setDeclaration.is(lastExpressionValue));
                if (setDeclaration !== undefined)
                {
                    setDeclaration.appendOperation(CallbackFunctionContext.getCurrentCallbackFunction(), new SetOperation('read', sourceCodeInfo));
                }
                else
                {
                    const location = sandbox.iidToLocation(iid);
                    console.warn(`Warning: set ${lastExpressionValue} read at ${location} is not in 'setDeclarations'`);
                }
            }
        };
    }

    private onAnalysisExit()
    {
        console.log(toJSON(this.setDeclarations));
    }
}

export default SetAsyncRace;