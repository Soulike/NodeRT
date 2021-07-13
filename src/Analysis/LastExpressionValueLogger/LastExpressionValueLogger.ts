// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {LastExpressionValueLogStore} from '../../LogStore/LastExpressionValueLogStore';

export class LastExpressionValueLogger extends Analysis
{
    public endExpression: Hooks['endExpression'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks(): void
    {
        this.endExpression = (_iid, _type, value) =>
        {
            LastExpressionValueLogStore.setLastExpressionValue(value);
        };
    }
}