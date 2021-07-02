// DO NOT INSTRUMENT

import Analysis from '../../Type/Analysis';
import Hooks from '../../Type/Hooks';
import Sandbox from '../../Type/Sandbox';
import MapDeclaration from './Class/MapDeclaration';
import MapOperation from './Class/MapOperation';
import SourceCodeInfo from '../Class/SourceCodeInfo';
import Range from '../Class/Range';
import CallbackFunctionContext from '../Singleton/CallbackFunctionContext';
import {getSourceCodeInfoFromIid, toJSON} from '../Util';
import LastExpressionValueContainer from '../Singleton/LastExpressionValueContainer';
import {strict as assert} from 'assert';

class MapOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public forObject: Hooks['forObject'] | undefined;

    private readonly mapDeclarations: MapDeclaration[];

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.mapDeclarations = [];

        this.registerHooks();

        process.on('exit', () => this.onAnalysisExit());
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, base, args, result, isConstructor, isMethod) =>
        {
            const readMethods: Function[] = [Map.prototype.get, Map.prototype.entries, Map.prototype.forEach, Map.prototype.has, Map.prototype.keys, Map.prototype.values, Map.prototype[Symbol.iterator]];
            const writeMethods: Function[] = [Map.prototype.set, Map.prototype.delete, Map.prototype.clear];
            if (f === Map && isConstructor)
            {
                assert.ok(result instanceof Map);
                const mapDeclaration = new MapDeclaration(result as Map<unknown, unknown>);
                this.mapDeclarations.push(mapDeclaration);
            }
            else if (base instanceof Map)
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
                    const mapDeclaration = this.mapDeclarations.find(mapDeclaration => mapDeclaration.is(base));
                    if (mapDeclaration !== undefined)
                    {
                        mapDeclaration.appendOperation(CallbackFunctionContext.getCurrentCallbackFunction(), new MapOperation(type, sourceCodeInfo));
                    }
                    else
                    {
                        const location = sandbox.iidToLocation(iid);
                        console.warn(`Warning: map ${base} ${type === 'read' ? 'read' : 'written'} at ${location} is not in 'mapDeclarations'`);
                    }
                }
                else
                {
                    const location = sandbox.iidToLocation(iid);
                    console.warn(`Warning: map ${base} is performed unknown method at ${location}`);
                }
            }
        };

        this.forObject = (iid, isForIn) =>
        {
            const lastExpressionValue = LastExpressionValueContainer.getLastExpressionValue();
            if (!isForIn && lastExpressionValue instanceof Map)
            {
                const sandbox = this.getSandbox();
                const {
                    name: fileName,
                    range,
                } = sandbox.iidToSourceObject(iid);

                const sourceCodeInfo = new SourceCodeInfo(fileName, new Range(range[0], range[1]));

                const mapDeclaration = this.mapDeclarations.find(mapDeclaration => mapDeclaration.is(lastExpressionValue));
                if (mapDeclaration !== undefined)
                {
                    mapDeclaration.appendOperation(CallbackFunctionContext.getCurrentCallbackFunction(), new MapOperation('read', sourceCodeInfo));
                }
                else
                {
                    const location = sandbox.iidToLocation(iid);
                    console.warn(`Warning: map ${lastExpressionValue} read at ${location} is not in 'mapDeclarations'`);
                }
            }
        };
    }

    private onAnalysisExit()
    {
        console.log(toJSON(this.mapDeclarations));
    }
}

export default MapOperationLogger;