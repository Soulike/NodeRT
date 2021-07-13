// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {ArrayLogStore, ArrayOperation} from '../../LogStore/ArrayLogStore';
import {AsyncContextLogStore} from '../../LogStore/AsyncContextLogStore';
import {getSourceCodeInfoFromIid, isArrayAccess} from '../../Util';
import {LastExpressionValueLogStore} from '../../LogStore/LastExpressionValueLogStore';
import {strict as assert} from 'assert';

/**Does not support spread expression now*/
export class ArrayOperationLogger extends Analysis
{
    public getField: Hooks['getField'] | undefined;
    public putFieldPre: Hooks['putFieldPre'] | undefined;
    public literal: Hooks['literal'] | undefined;
    public invokeFun: Hooks['invokeFun'] | undefined;
    public forObject: Hooks['forObject'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks()
    {
        const sandbox = this.getSandbox();

        this.literal = (iid, val, _fakeHasGetterSetter, literalType) =>
        {
            if (literalType === 'ArrayLiteral')
            {
                assert.ok(Array.isArray(val));
                ArrayLogStore.appendArrayOperation(val, 'write', sandbox, iid);
            }
        };

        this.getField = (iid, base, offset: string | Symbol, _val: unknown, isComputed: boolean) =>
        {
            if (Array.isArray(base) && isArrayAccess(isComputed, offset))
            {
                ArrayLogStore.appendArrayOperation(base, 'read', sandbox, iid);
            }
        };

        this.putFieldPre = (iid, base, offset: string | Symbol, _val: unknown, isComputed: boolean) =>
        {
            if (Array.isArray(base) && isArrayAccess(isComputed, offset))
            {
                ArrayLogStore.appendArrayOperation(base, 'write', sandbox, iid);
            }
        };

        this.invokeFun = (iid, f, base, args, result) =>
        {
            if (f === Array || f === Array.of)
            {
                assert.ok(Array.isArray(result));
                ArrayLogStore.appendArrayOperation(result, 'write', sandbox, iid);
            }
            else if (f === Array.from)
            {
                const iterable = args[0];
                if (Array.isArray(iterable))    // TODO: TypedArray
                {
                    ArrayLogStore.appendArrayOperation(iterable, 'read', sandbox, iid);
                }
                assert.ok(Array.isArray(result));
                ArrayLogStore.appendArrayOperation(result, 'write', sandbox, iid);
            }
            else if (f === Array.prototype.concat)
            {
                const arg = args[0];
                assert.ok(Array.isArray(arg));
                ArrayLogStore.appendArrayOperation(arg, 'read', sandbox, iid);

                assert.ok(Array.isArray(base));
                ArrayLogStore.appendArrayOperation(base, 'read', sandbox, iid);

                assert.ok(Array.isArray(result));
                ArrayLogStore.appendArrayOperation(result, 'write', sandbox, iid);
            }
            else if (f === Array.prototype.copyWithin)
            {
                assert.ok(Array.isArray(base));
                ArrayLogStore.appendArrayOperation(base, 'read', sandbox, iid);
                ArrayLogStore.appendArrayOperation(base, 'write', sandbox, iid);
            }
            else if (f === Array.prototype.entries || f === Array.prototype.keys || f === Array.prototype.values
                || f === Array.prototype.every || f === Array.prototype.find || f === Array.prototype.findIndex
                || f === Array.prototype.indexOf || f === Array.prototype.lastIndexOf
                || f === Array.prototype.forEach || f === Array.prototype.includes
                || f === Array.prototype.join || f === Array.prototype.reduce || f === Array.prototype.reduceRight
                || f === Array.prototype.some || f === Array.prototype.toString || f === Array.prototype.toLocaleString
            )
            {
                assert.ok(Array.isArray(base));
                ArrayLogStore.appendArrayOperation(base, 'read', sandbox, iid);
            }
            else if (f === Array.prototype.fill)
            {
                if (Array.isArray(base))
                {
                    ArrayLogStore.appendArrayOperation(base, 'write', sandbox, iid);
                }
            }
            else if (f === Array.prototype.pop || f === Array.prototype.push || f === Array.prototype.shift
                || f === Array.prototype.reverse || f === Array.prototype.sort || f === Array.prototype.unshift)
            {
                assert.ok(Array.isArray(base));
                ArrayLogStore.appendArrayOperation(base, 'write', sandbox, iid);
            }
            else if (f === Array.prototype.filter
                || f === Array.prototype.flat
                || f === Array.prototype.flatMap  // for performance, flat() is not precise, should be recursive
                || f === Array.prototype.map
                || f === Array.prototype.slice)
            {
                assert.ok(Array.isArray(base));
                ArrayLogStore.appendArrayOperation(base, 'read', sandbox, iid);

                assert.ok(Array.isArray(result));
                ArrayLogStore.appendArrayOperation(result, 'write', sandbox, iid);
            }
            else if (f === Array.prototype.splice)
            {
                assert.ok(Array.isArray(base));
                ArrayLogStore.appendArrayOperation(base, 'write', sandbox, iid);

                assert.ok(Array.isArray(result));
                ArrayLogStore.appendArrayOperation(result, 'write', sandbox, iid);
            }
        };


        this.forObject = (iid, isForIn) =>
        {
            const lastExpressionValue = LastExpressionValueLogStore.getLastExpressionValue();
            if (!isForIn && Array.isArray(lastExpressionValue))
            {
                const sandbox = this.getSandbox();
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, sandbox);

                const arrayDeclaration = ArrayLogStore.getArrayDeclarations().find(arrayDeclaration => arrayDeclaration.is(lastExpressionValue));
                if (arrayDeclaration !== undefined)
                {
                    arrayDeclaration.appendOperation(AsyncContextLogStore.getCurrentCallbackFunction(), new ArrayOperation('read', sourceCodeInfo));
                }
                else
                {
                    const location = sandbox.iidToLocation(iid);
                    console.warn(`Warning: array ${lastExpressionValue} read at ${location} is not in 'arrayDeclarations'`);
                }
            }
        };
    }
}