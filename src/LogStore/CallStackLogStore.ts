// DO NOT INSTRUMENT

import {strict as assert} from 'assert';

export class CallStackLogStore
{
    private static readonly iidCallStack: number[] = [];

    public static push(iid: number)
    {
        this.iidCallStack.push(iid);
    }

    public static getTop(): number
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

    public static getCallStack(): readonly number[]
    {
        return CallStackLogStore.iidCallStack;
    }
}