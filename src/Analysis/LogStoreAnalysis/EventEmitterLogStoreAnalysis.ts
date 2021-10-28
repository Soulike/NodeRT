import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {outputSync, toJSON} from '../../Util';
import {EventEmitterLogStore} from '../../LogStore/EventEmitterLogStore';

export class EventEmitterLogStoreAnalysis extends Analysis
{
    public endExecution: Hooks['endExecution'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
    }

    protected registerHooks(): void
    {
        this.endExecution = () =>
        {
            outputSync(toJSON(EventEmitterLogStore.getEventEmitterDeclarations()), 'eventEmitterLogStore.json');
        };
    }
}