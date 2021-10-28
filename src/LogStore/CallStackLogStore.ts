// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import {Sandbox} from '../Type/nodeprof';
import os from 'os';

export class CallStackLogStore
{
    private static readonly iidCallStack: number[] = [];
    private static readonly iidToLocation: Map<number, string> = new Map();

    public static push(sandbox: Sandbox, iid: number)
    {
        this.iidCallStack.push(iid);
        this.iidToLocation.set(iid, sandbox.iidToLocation(iid));
    }

    public static getTopIid(): number
    {
        if (CallStackLogStore.iidCallStack.length > 0)
        {
            return CallStackLogStore.iidCallStack[CallStackLogStore.iidCallStack.length - 1]!;
        }
        else
        {
            return -1;  // returns a invalid iid if call stack is empty
        }
    }

    public static pop()
    {
        assert.ok(CallStackLogStore.iidCallStack.length > 0);
        CallStackLogStore.iidCallStack.length--;
    }

    public static getCallStackIids(): readonly number[]
    {
        return CallStackLogStore.iidCallStack;
    }

    public static getCallStack(): string | null
    {
        const locations: string[] = [];
        for (const iid of CallStackLogStore.iidCallStack)
        {
            const location = CallStackLogStore.iidToLocation.get(iid);
            assert.ok(location !== undefined);
            locations.push(location);
        }
        if (locations.length === 0)
        {
            return null;
        }
        return locations.join(os.EOL);
    }
}