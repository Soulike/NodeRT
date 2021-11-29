// DO NOT INSTRUMENT

import {MemoryUsageLogStore} from '../../LogStore/MemoryUsageLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';

export class MemoryUsageAnalysis extends Analysis
{
    public endExecution: Hooks['endExecution'] | undefined;

    private readonly interval: ReturnType<typeof setInterval>;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.interval = setInterval(() =>
        {
            MemoryUsageLogStore.memoryUsage = Math.max(process.memoryUsage().rss, MemoryUsageLogStore.memoryUsage);
        }, 1000);
    }

    protected registerHooks(): void
    {
        this.endExecution = () =>
        {
            clearInterval(this.interval);
            console.log(`max memory usage: ${MemoryUsageLogStore.memoryUsage / 1024 / 1024 / 1024} GB`);
        };
    }
}