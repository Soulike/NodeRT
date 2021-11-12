import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {isObject} from 'lodash';
import {isBufferLike, shouldBeVerbose} from '../../Util';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import assert from 'assert';

export class JSONOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public endExecution: Hooks['endExecution'] | undefined;

    private timeConsumed: number;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.timeConsumed = 0;
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, _base, args, result) =>
        {
            const startTimestamp = Date.now();

            if (f === JSON.stringify)
            {
                const [value] = args as Parameters<typeof JSON.stringify>;
                if (isObject(value))
                {
                    ObjectLogStore.appendObjectOperation(value, 'read', Object.keys(value), this.getSandbox(), iid);
                }
                if (isBufferLike(value))
                {
                    BufferLogStore.appendBufferOperation(value, 'read', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(value), this.getSandbox(), iid);
                }
            }
            else if (f === JSON.parse)
            {
                const object = result as ReturnType<typeof JSON.parse>;
                assert.ok(isObject(object));
                if (isObject(object))
                {
                    ObjectLogStore.appendObjectOperation(object, 'write', Object.keys(object), this.getSandbox(), iid);
                }
                if (isBufferLike(object))
                {
                    BufferLogStore.appendBufferOperation(object, 'write', 'finish',
                        BufferLogStore.getArrayBufferFieldsOfArrayBufferView(object),
                        this.getSandbox(), iid);
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`JSON: ${this.timeConsumed / 1000}s`);
            }
        };
    }
}