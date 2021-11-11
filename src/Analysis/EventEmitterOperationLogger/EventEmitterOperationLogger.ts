import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {EventEmitter} from 'events';
import {EventEmitterLogStore} from '../../LogStore/EventEmitterLogStore';
import {getSourceCodeInfoFromIid, shouldBeVerbose} from '../../Util';
import {CallStackLogStore} from '../../LogStore/CallStackLogStore';

export class EventEmitterOperationLogger extends Analysis
{
    public invokeFunPre: Hooks['invokeFunPre'] | undefined;
    public endExecution: Hooks['endExecution'] | undefined;

    private timeConsumed: number;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.timeConsumed = 0;
    }

    protected override registerHooks()
    {
        this.invokeFunPre = (iid, f, base, args) =>
        {
            const startTimestamp = Date.now();
            if (base instanceof EventEmitter)
            {
                if (f === EventEmitter.prototype.addListener
                    || f === EventEmitter.prototype.on
                    || f === EventEmitter.prototype.prependListener)
                {
                    const [event, listener] = args as Parameters<typeof EventEmitter.prototype.addListener>;
                    EventEmitterLogStore.appendOperation(base, event, 'write', 'addListener',
                        [listener], getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === EventEmitter.prototype.emit)
                {
                    const [event] = args as Parameters<typeof EventEmitter.prototype.emit>;
                    EventEmitterLogStore.appendOperation(base, event, 'read', 'emit',
                        base.listeners(event), getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === EventEmitter.prototype.off
                    || f === EventEmitter.prototype.removeListener)
                {
                    const [event, listener] = args as Parameters<typeof EventEmitter.prototype.removeListener>;
                    EventEmitterLogStore.appendOperation(base, event, 'write', 'removeListener',
                        [listener], getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (f === EventEmitter.prototype.removeAllListeners)
                {
                    const [event] = args as Parameters<typeof EventEmitter.prototype.removeAllListeners>;
                    if (event !== undefined)
                    {
                        EventEmitterLogStore.appendOperation(base, event, 'write', 'removeListener',
                            base.listeners(event), getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                    else
                    {
                        const eventNames = base.eventNames();
                        for (const eventName of eventNames)
                        {
                            EventEmitterLogStore.appendOperation(base, eventName, 'write', 'removeListener',
                                base.listeners(eventName), getSourceCodeInfoFromIid(iid, this.getSandbox()));
                        }
                    }
                }
                else if (f === EventEmitter.prototype.once
                    || f === EventEmitter.prototype.prependOnceListener)
                {
                    const [event, listener] = args as Parameters<typeof EventEmitter.prototype.once>;
                    EventEmitterLogStore.appendOperation(base, event, 'write', 'addListener',
                        [listener], getSourceCodeInfoFromIid(iid, this.getSandbox()));

                    base.on(event, () =>
                    {
                        EventEmitterLogStore.appendOperation(base, event, 'write', 'removeListener',
                            [listener], getSourceCodeInfoFromIid(CallStackLogStore.getTopIid(), this.getSandbox()));
                    });
                }
            }
            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`EventEmitter: ${this.timeConsumed / 1000}s`);
            }
        };
    }
}