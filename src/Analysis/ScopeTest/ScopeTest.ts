// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {strict as assert} from 'assert';

class ScopeTest extends Analysis
{
    public declare: Hooks['declare'] | undefined;
    public functionEnter: Hooks['functionEnter'] | undefined;
    public functionExit: Hooks['functionExit'] | undefined;
    public literal: Hooks['literal'] | undefined;
    public read: Hooks['read'] | undefined;
    public write: Hooks['write'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.literal = (iid, val, fakeHasGetterSetter, literalType) =>
        {
            if (literalType === 'FunctionLiteral')
            {
                assert.ok(typeof val === 'function');
                console.log(`literal: iid=${iid} name=${val.name}`);
            }
        };

        this.declare = (iid, name, type, kind) =>
        {
            if (kind === undefined)
            {
                console.log(`declare: name=${name} type=${type} kind=${kind}`);
            }
        };

        this.functionEnter = (iid, f, dis, args) =>
        {
            console.log(`functionEnter: iid=${iid} name=${f.name}`);
        };

        this.functionExit = (iid, returnVal, wrappedExceptionVal) =>
        {
            console.log(`functionExit: iid=${iid}`);
        };

        this.read = (iid, name, val, isGlobal) =>
        {
            console.log(`read: iid=${iid} name=${name}`);
        };

        this.write = (iid, name, val, lhs, isGlobal) =>
        {
            console.log(`write: iid=${iid} name=${name}`);
        };
    }
}

export default ScopeTest;