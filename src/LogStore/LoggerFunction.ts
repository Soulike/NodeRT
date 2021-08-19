// DO NOT INSTRUMENT

import {Sandbox} from '../Type/nodeprof';
import {isObject} from 'lodash';
import {ObjectLogStore} from './ObjectLogStore';
import {BufferLogStore} from './BufferLogStore';
import {strict as assert} from 'assert';
import {isBufferLike, getSourceCodeInfoFromIid} from '../Util';

export function logObjectArgsAsReadOperation(args: unknown[], sandbox: Sandbox, iid: number): void
{
    for (const arg of args)
    {
        if (isBufferLike(arg))
        {
            BufferLogStore.appendBufferOperation(arg, 'read',
                getSourceCodeInfoFromIid(iid, sandbox));
        }
        else if (isObject(arg))
        {
            ObjectLogStore.appendObjectOperation(arg, 'read', sandbox, iid);
        }
    }
}

export function logObjectResultAsWriteOperation(result: unknown, sandbox: Sandbox, iid: number): void
{
    if (isObject(result))
    {
        ObjectLogStore.appendObjectOperation(result, 'write', sandbox, iid);
        if (isBufferLike(result))
        {
            BufferLogStore.appendBufferOperation(result, 'write',
                getSourceCodeInfoFromIid(iid, sandbox));
        }
    }
}

function logObjectBaseAsOperation(base: object, sandbox: Sandbox, iid: number, type: 'read' | 'write'): void
{
    assert.ok(isObject(base));
    if (isBufferLike(base))
    {
        BufferLogStore.appendBufferOperation(base, type,
            getSourceCodeInfoFromIid(iid, sandbox));
    }
    else if (isObject(base))
    {
        ObjectLogStore.appendObjectOperation(base, type, sandbox, iid);
    }
}

export function logObjectBaseAsReadOperation(base: object, sandbox: Sandbox, iid: number): void
{
    logObjectBaseAsOperation(base, sandbox, iid, 'read');
}

export function logObjectBaseAsWriteOperation(base: object, sandbox: Sandbox, iid: number): void
{
    logObjectBaseAsOperation(base, sandbox, iid, 'write');
}