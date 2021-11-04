// DO NOT INSTRUMENT

import {FileHandle} from 'fs/promises';
import {isObject} from 'lodash';
import {BufferLogStore} from '../../../LogStore/BufferLogStore';
import {FileLogStore} from '../../../LogStore/FileLogStore';
import {ObjectLogStore} from '../../../LogStore/ObjectLogStore';
import {Analysis, Hooks, Sandbox} from '../../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike, shouldBeVerbose} from '../../../Util';
import {FileLogStoreAdaptor} from '../FileLogStoreAdaptor';
import assert from 'assert';
import util from 'util';

export class FileHandleOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public functionEnter: Hooks['functionEnter'] | undefined;
    public endExecution: Hooks['endExecution'] | undefined;

    private timeConsumed: number;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.timeConsumed = 0;
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, base, args, result) =>
        {
            const startTimestamp = Date.now();

            if (FileLogStore.hasFileHandle(base as any))
            {
                const fileHandle = base as FileHandle;

                if (f === fileHandle.appendFile)
                {
                    if (isBufferLike(args[0]))
                    {
                        BufferLogStore.appendBufferOperation(args[0], 'read',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                    FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', this.getSandbox(), iid);
                    assert.ok(util.types.isPromise(result));
                    result.finally(() => FileLogStoreAdaptor.appendFileOperation(fileHandle, 'write', this.getSandbox(), iid));
                }
                else if (f === fileHandle.close)
                {
                    (result as ReturnType<typeof fileHandle.close>).then(
                        () => FileLogStore.deleteFileHandle(fileHandle));
                }
                else if (f === fileHandle.read)
                {
                    FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', this.getSandbox(), iid);
                    (result as ReturnType<typeof fileHandle.read>)
                        .then(({buffer}) =>
                        {
                            BufferLogStore.appendBufferOperation(buffer.buffer, 'write',
                                getSourceCodeInfoFromIid(iid, this.getSandbox()));
                        })
                        .finally(() => FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', this.getSandbox(), iid));
                }
                else if (f === fileHandle.readFile
                    || f === fileHandle.stat)
                {
                    FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', this.getSandbox(), iid);
                    assert.ok(util.types.isPromise(result));
                    result.finally(() => FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', this.getSandbox(), iid));
                }
                else if (f === fileHandle.readv)
                {
                    FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', this.getSandbox(), iid);
                    (result as ReturnType<typeof fileHandle.readv>)
                        .then(({buffers}) =>
                        {
                            for (const buffer of buffers)
                            {
                                BufferLogStore.appendBufferOperation(buffer.buffer, 'write',
                                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
                            }
                        })
                        .finally(() => FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', this.getSandbox(), iid));
                }
                else if (f === fileHandle.truncate
                    || f === fileHandle.chmod
                    || f === fileHandle.chown)
                {
                    FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', this.getSandbox(), iid);
                    assert.ok(util.types.isPromise(result));
                    result.finally(() => FileLogStoreAdaptor.appendFileOperation(fileHandle, 'write', this.getSandbox(), iid));
                }
                else if (f === fileHandle.write
                    || f === fileHandle.writeFile)
                {
                    if (isBufferLike(args[0]))
                    {
                        BufferLogStore.appendBufferOperation(args[0], 'read',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                    else if (isObject(args[0]))
                    {
                        ObjectLogStore.appendObjectOperation(args[0], 'read', null, this.getSandbox(), iid);
                    }
                    FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', this.getSandbox(), iid);
                    assert.ok(util.types.isPromise(result));
                    result.finally(() => FileLogStoreAdaptor.appendFileOperation(fileHandle, 'write', this.getSandbox(), iid));
                }
                else if (f === fileHandle.writev)
                {
                    FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', this.getSandbox(), iid);
                    (result as ReturnType<typeof fileHandle.writev>)
                        .then(({buffers}) =>
                        {
                            for (const buffer of buffers)
                            {
                                BufferLogStore.appendBufferOperation(buffer.buffer, 'read',
                                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
                            }
                        })
                        .finally(() => FileLogStoreAdaptor.appendFileOperation(fileHandle, 'write', this.getSandbox(), iid));
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`FileHandle: ${this.timeConsumed / 1000}s`);
            }
        };
    }
}