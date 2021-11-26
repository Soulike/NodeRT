// DO NOT INSTRUMENT

import fsPromise from 'fs/promises';
import {isObject} from 'lodash';
import {Readable} from 'stream';
import {BufferLogStore} from '../../../LogStore/BufferLogStore';
import {FileLogStore} from '../../../LogStore/FileLogStore';
import {ObjectLogStore} from '../../../LogStore/ObjectLogStore';
import {StreamLogStore} from '../../../LogStore/StreamLogStore';
import {Analysis, Hooks, Sandbox} from '../../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike, shouldBeVerbose} from '../../../Util';
import {FileLogStoreAdaptor} from '../FileLogStoreAdaptor';
import assert from 'assert';
import util from 'util';
import {willFileBeCreatedOrTruncated} from '../Util';

export class FsPromisesOperationLogger extends Analysis
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

            if (f === fsPromise.appendFile)
            {
                const [path, data] = args as Parameters<typeof fsPromise.appendFile>;
                if (isBufferLike(data))
                {
                    BufferLogStore.appendBufferOperation(data, 'read', 'start',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(data),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                FileLogStoreAdaptor.appendFileOperation(path, 'read', 'start', 'content', this.getSandbox(), iid);
                assert.ok(util.types.isPromise(result));
                result.finally(() =>
                {
                    if (isBufferLike(data))
                    {
                        BufferLogStore.appendBufferOperation(data, 'read', 'finish',
                            BufferLogStore.getArrayBufferRangeOfArrayBufferView(data),
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                    FileLogStoreAdaptor.appendFileOperation(path, 'write', 'finish', 'content', this.getSandbox(), iid);
                });
            }
            else if (f === fsPromise.copyFile
                || f === fsPromise.cp)
            {
                const [src, dst] = args as Parameters<typeof fsPromise.copyFile
                    | typeof fsPromise.cp>;
                FileLogStoreAdaptor.appendFileOperation(src, 'read', 'start', 'content', this.getSandbox(), iid);
                FileLogStoreAdaptor.appendFileOperation(dst, 'read', 'start', 'content', this.getSandbox(), iid);
                assert.ok(util.types.isPromise(result));
                result.finally(() =>
                {
                    FileLogStoreAdaptor.appendFileOperation(src, 'read', 'finish', 'content', this.getSandbox(), iid);
                    FileLogStoreAdaptor.appendFileOperation(dst, 'write', 'finish', 'content', this.getSandbox(), iid);
                });

            }
            else if (f === fsPromise.rename)
            {
                const [src, dst] = args as Parameters<typeof fsPromise.rename>;
                FileLogStoreAdaptor.appendFileOperation(src, 'read', 'start', 'content', this.getSandbox(), iid);
                FileLogStoreAdaptor.appendFileOperation(dst, 'read', 'start', 'content', this.getSandbox(), iid);
                assert.ok(util.types.isPromise(result));
                result.finally(() =>
                {
                    FileLogStoreAdaptor.appendFileOperation(src, 'read', 'finish', 'content', this.getSandbox(), iid);
                    FileLogStoreAdaptor.appendFileOperation(dst, 'write', 'finish', 'content', this.getSandbox(), iid);
                });

            }
            else if (f === fsPromise.mkdir
                || f === fsPromise.rmdir
                || f === fsPromise.rm
                || f === fsPromise.unlink)
            {
                const [path] = args as Parameters<typeof fsPromise.mkdir
                    | typeof fsPromise.rmdir
                    | typeof fsPromise.rm
                    | typeof fsPromise.unlink>;
                FileLogStoreAdaptor.appendFileOperation(path, 'read', 'start', 'content', this.getSandbox(), iid);
                assert.ok(util.types.isPromise(result));
                result.finally(() =>
                {
                    FileLogStoreAdaptor.appendFileOperation(path, 'write', 'finish', 'content', this.getSandbox(), iid);
                });
            }
            else if (f === fsPromise.truncate)
            {
                const [path] = args as Parameters<typeof fsPromise.truncate>;
                FileLogStoreAdaptor.appendFileOperation(path, 'read', 'start', 'content', this.getSandbox(), iid);
                assert.ok(util.types.isPromise(result));
                result.finally(() => FileLogStoreAdaptor.appendFileOperation(path, 'write', 'finish', 'content', this.getSandbox(), iid));

            }
            else if (f === fsPromise.mkdtemp)
            {
                (result as ReturnType<typeof fsPromise.mkdtemp>).then(
                    path =>
                    {
                        FileLogStoreAdaptor.appendFileOperation(path, 'write', 'finish', 'content', this.getSandbox(), iid);
                    });
            }
            else if (f === fsPromise.open)
            {
                const [path, flags] = args as Parameters<typeof fsPromise.open>;
                const fileWillBeCreatedOrTruncated = willFileBeCreatedOrTruncated(flags);

                (result as ReturnType<typeof fsPromise.open>).then(fileHandle =>
                {
                    if (fileWillBeCreatedOrTruncated)
                    {
                        FileLogStoreAdaptor.appendFileOperation(path, 'read', 'finish', 'content', this.getSandbox(), iid);
                    }
                    FileLogStore.addFileHandle(fileHandle, path, getSourceCodeInfoFromIid(iid, this.getSandbox()));
                });
            }
            else if (f === fsPromise.readdir
                || f === fsPromise.readFile)
            {
                const [path] = args as Parameters<typeof fsPromise.readdir
                    | typeof fsPromise.readFile>;
                FileLogStoreAdaptor.appendFileOperation(path, 'read', 'start', 'content', this.getSandbox(), iid);
                assert.ok(util.types.isPromise(result));
                result.finally(() => FileLogStoreAdaptor.appendFileOperation(path, 'read', 'finish', 'content', this.getSandbox(), iid));
            }
            else if (f === fsPromise.access
                || f === fsPromise.stat
                || f === fsPromise.lstat)
            {
                const [path] = args as Parameters<typeof fsPromise.stat
                    | typeof fsPromise.lstat
                    | typeof fsPromise.access>;
                FileLogStoreAdaptor.appendFileOperation(path, 'read', 'start', 'stat', this.getSandbox(), iid);
                assert.ok(util.types.isPromise(result));
                result.finally(() => FileLogStoreAdaptor.appendFileOperation(path, 'read', 'finish', 'stat', this.getSandbox(), iid));
            }
            else if (f === fsPromise.chmod
                || f === fsPromise.chown
                || f === fsPromise.lchmod
                || f === fsPromise.lchown)
            {
                const [path] = args as Parameters<typeof fsPromise.chmod>;
                FileLogStoreAdaptor.appendFileOperation(path, 'read', 'start', 'stat', this.getSandbox(), iid);
                assert.ok(util.types.isPromise(result));
                result.finally(() => FileLogStoreAdaptor.appendFileOperation(path, 'write', 'finish', 'stat', this.getSandbox(), iid));
            }
            else if (f === fsPromise.writeFile)
            {
                const [file, data] = args as Parameters<typeof fsPromise.writeFile>;
                if (isBufferLike(data))
                {
                    BufferLogStore.appendBufferOperation(data, 'read', 'start',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(data),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                if (data instanceof Readable)
                {
                    StreamLogStore.appendStreamOperation(data, 'read', 'read', this.getSandbox(), iid);
                }
                else if (isObject(data))
                {
                    ObjectLogStore.appendObjectOperation(data, 'read', Object.keys(data), false, this.getSandbox(), iid);
                }
                FileLogStoreAdaptor.appendFileOperation(file, 'read', 'start', 'content', this.getSandbox(), iid);
                assert.ok(util.types.isPromise(result));
                result.finally(() =>
                {
                    if (isBufferLike(data))
                    {
                        BufferLogStore.appendBufferOperation(data, 'read', 'finish',
                            BufferLogStore.getArrayBufferRangeOfArrayBufferView(data),
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                    if (data instanceof Readable)
                    {
                        StreamLogStore.appendStreamOperation(data, 'read', 'read', this.getSandbox(), iid);
                    }
                    else if (isObject(data))
                    {
                        ObjectLogStore.appendObjectOperation(data, 'read', Object.keys(data), false, this.getSandbox(), iid);
                    }
                    FileLogStoreAdaptor.appendFileOperation(file, 'write', 'finish', 'content', this.getSandbox(), iid);
                });
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`FsPromises: ${this.timeConsumed / 1000}s`);
            }
        };
    }
}