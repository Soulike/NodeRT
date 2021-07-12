// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import SetDeclaration from './Class/SetDeclaration';
import SetOperation from './Class/SetOperation';
import CallbackFunctionContext from '../Singleton/CallbackFunctionContext';
import {getSourceCodeInfoFromIid, toJSON} from '../Util';
import LastExpressionValueContainer from '../Singleton/LastExpressionValueContainer';
import {strict as assert} from 'assert';

class SetOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public forObject: Hooks['forObject'] | undefined;

    private readonly setDeclarations: SetDeclaration[];

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.setDeclarations = [];

        this.registerHooks();

        process.on('exit', () => this.onAnalysisExit());
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, base, _args, result, isConstructor) =>
        {
            const readMethods: Function[] = [Set.prototype.entries, Set.prototype.forEach, Set.prototype.has, Set.prototype.keys, Set.prototype.values, Set.prototype[Symbol.iterator]];
            const writeMethods: Function[] = [Set.prototype.add, Set.prototype.delete, Set.prototype.clear];
            if (f === Set && isConstructor)
            {
                assert.ok(result instanceof Set);
                const setDeclaration = new SetDeclaration(result as Set<unknown>);
                this.setDeclarations.push(setDeclaration);
            }
            else if (base instanceof Set)
            {
                const sandbox = this.getSandbox();

                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);

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
                    const location = sandbox.iidToLocation(iid);
                    console.warn(`Warning: set ${base} is performed unknown method at ${location}`);
                }
            }
        };

        this.forObject = (iid, isForIn) =>
        {
            const lastExpressionValue = LastExpressionValueContainer.getLastExpressionValue();
            if (!isForIn && lastExpressionValue instanceof Set)
            {
                const sandbox = this.getSandbox();

                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);

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

export default SetOperationLogger;