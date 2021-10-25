// DO NOT INSTRUMENT

import {LastExpressionValueLogStore} from '../../LogStore/LastExpressionValueLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {shouldBeVerbose} from '../../Util';

export class LastExpressionValueLogger extends Analysis
{
    public endExpression: Hooks['endExpression'] | undefined;
    public endExecution: Hooks['endExecution'] | undefined;

    private timeConsumed: number;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.timeConsumed = 0;
    }

    protected override registerHooks(): void
    {
        this.endExpression = (_iid, _type, value) =>
        {
            const startTimestamp = Date.now();

            LastExpressionValueLogStore.setLastExpressionValue(value);

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`LastExpression: ${this.timeConsumed / 1000}s`);
            }
        }
    }
}