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
                        BufferLogStore.appendBufferOperation(args[0], 'read', 'start',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                    FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', 'start', 'content', this.getSandbox(), iid);
                    assert.ok(util.types.isPromise(result));
                    result.finally(() =>
                    {
                        if (isBufferLike(args[0]))
                        {
                            BufferLogStore.appendBufferOperation(args[0], 'read', 'finish',
                                getSourceCodeInfoFromIid(iid, this.getSandbox()));
                        }
                        FileLogStoreAdaptor.appendFileOperation(fileHandle, 'write', 'finish', 'content', this.getSandbox(), iid);
                    });
                }
                else if (f === fileHandle.close)
                {
                    (result as ReturnType<typeof fileHandle.close>).then(
                        () => FileLogStore.deleteFileHandle(fileHandle));
                }
                else if (f === fileHandle.read)
                {
                    const [bufferOrOptions] = args as Parameters<typeof fileHandle.read>;
                    if (bufferOrOptions !== undefined)
                    {
                        if (isBufferLike(bufferOrOptions))
                        {
                            assert.ok(!util.types.isArrayBuffer(bufferOrOptions));
                            BufferLogStore.appendBufferOperation(bufferOrOptions.buffer, 'read', 'start',
                                getSourceCodeInfoFromIid(iid, this.getSandbox()));
                        }
                        else
                        {
                            const {buffer} = bufferOrOptions;
                            if (buffer !== undefined)
                            {
                                BufferLogStore.appendBufferOperation(buffer.buffer, 'read', 'start',
                                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
                            }
                        }
                    }
                    FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', 'start', 'content', this.getSandbox(), iid);

                    (result as ReturnType<typeof fileHandle.read>)
                        .then(({buffer}) =>
                        {
                            BufferLogStore.appendBufferOperation(buffer.buffer, 'write', 'finish',
                                getSourceCodeInfoFromIid(iid, this.getSandbox()));
                        })
                        .finally(() => FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', 'finish', 'content', this.getSandbox(), iid));
                }
                else if (f === fileHandle.readFile)
                {
                    FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', 'start', 'content', this.getSandbox(), iid);
                    assert.ok(util.types.isPromise(result));
                    result.finally(() => FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', 'finish', 'content', this.getSandbox(), iid));
                }
                else if (f === fileHandle.stat)
                {
                    FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', 'start', 'stat', this.getSandbox(), iid);
                    assert.ok(util.types.isPromise(result));
                    result.finally(() => FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', 'finish', 'stat', this.getSandbox(), iid));
                }
                else if (f === fileHandle.readv)
                {
                    const [buffers] = args as Parameters<typeof fileHandle.readv>;
                    for (const buffer of buffers)
                    {
                        BufferLogStore.appendBufferOperation(buffer.buffer, 'read', 'start',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                    FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', 'start', 'content', this.getSandbox(), iid);

                    (result as ReturnType<typeof fileHandle.readv>)
                        .then(({buffers}) =>
                        {
                            for (const buffer of buffers)
                            {
                                BufferLogStore.appendBufferOperation(buffer.buffer, 'write', 'finish',
                                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
                            }
                        })
                        .finally(() => FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', 'finish', 'content', this.getSandbox(), iid));
                }
                else if (f === fileHandle.truncate)
                {
                    FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', 'start', 'content', this.getSandbox(), iid);
                    assert.ok(util.types.isPromise(result));
                    result.finally(() => FileLogStoreAdaptor.appendFileOperation(fileHandle, 'write', 'finish', 'content', this.getSandbox(), iid));
                }
                else if (f === fileHandle.chmod
                    || f === fileHandle.chown)
                {
                    FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', 'start', 'stat', this.getSandbox(), iid);
                    assert.ok(util.types.isPromise(result));
                    result.finally(() => FileLogStoreAdaptor.appendFileOperation(fileHandle, 'write', 'finish', 'stat', this.getSandbox(), iid));
                }
                else if (f === fileHandle.write
                    || f === fileHandle.writeFile)
                {
                    if (isBufferLike(args[0]))
                    {
                        BufferLogStore.appendBufferOperation(args[0], 'read', 'start',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                    else if (isObject(args[0]))
                    {
                        ObjectLogStore.appendObjectOperation(args[0], 'read', null, this.getSandbox(), iid);
                    }
                    FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', 'start', 'content', this.getSandbox(), iid);
                    assert.ok(util.types.isPromise(result));
                    result.finally(() =>
                    {
                        if (isBufferLike(args[0]))
                        {
                            BufferLogStore.appendBufferOperation(args[0], 'read', 'finish',
                                getSourceCodeInfoFromIid(iid, this.getSandbox()));
                        }
                        else if (isObject(args[0]))
                        {
                            ObjectLogStore.appendObjectOperation(args[0], 'read', null, this.getSandbox(), iid);
                        }
                        FileLogStoreAdaptor.appendFileOperation(fileHandle, 'write', 'finish', 'content', this.getSandbox(), iid);
                    });
                }
                else if (f === fileHandle.writev)
                {
                    const [buffers] = args as Parameters<typeof fileHandle.writev>;
                    for (const buffer of buffers)
                    {
                        BufferLogStore.appendBufferOperation(buffer.buffer, 'read', 'start',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                    FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', 'start', 'content', this.getSandbox(), iid);
                    (result as ReturnType<typeof fileHandle.writev>)
                        .then(({buffers}) =>
                        {
                            for (const buffer of buffers)
                            {
                                BufferLogStore.appendBufferOperation(buffer.buffer, 'read', 'finish',
                                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
                            }
                        })
                        .finally(() => FileLogStoreAdaptor.appendFileOperation(fileHandle, 'write', 'finish', 'content', this.getSandbox(), iid));
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