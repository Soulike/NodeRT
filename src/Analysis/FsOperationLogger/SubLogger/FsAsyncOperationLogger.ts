// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import fs from 'fs';
import {isObject} from 'lodash';
import {BufferLogStore} from '../../../LogStore/BufferLogStore';
import {FileLogStore} from '../../../LogStore/FileLogStore';
import {ObjectLogStore} from '../../../LogStore/ObjectLogStore';
import {Analysis, Hooks, Sandbox} from '../../../Type/nodeprof';
import {getSourceCodeInfoFromIid, getUnboundFunction, isBufferLike, shouldBeVerbose} from '../../../Util';
import {BufferLike} from '../../Type/BufferLike';
import {FileLogStoreAdaptor} from '../FileLogStoreAdaptor';
import asyncHooks from 'async_hooks';
import {AsyncContextLogStore} from '../../../LogStore/AsyncContextLogStore';
import {willFileBeCreatedOrTruncated} from '../Util';

interface RegistrationInfo
{
    register: Function,
    registerAsyncId: number,    // executionAsyncId when register is being executed
    callback?: Function, // Function to be called when the registered fs callback is called
    filePathLike?: string | URL | BufferLike,
}

export class FsAsyncOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public functionEnter: Hooks['functionEnter'] | undefined;
    public endExecution: Hooks['endExecution'] | undefined;

    private timeConsumed: number;

    private readonly callbackToRegistrationInfos: WeakMap<Function, RegistrationInfo[]>;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.callbackToRegistrationInfos = new WeakMap();
        this.timeConsumed = 0;
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, _base, args) =>
        {
            const startTimestamp = Date.now();

            if (f === fs.appendFile)
            {
                const [path, data] = args as Parameters<typeof fs.appendFile>;
                if (isBufferLike(data))
                {
                    BufferLogStore.appendBufferOperation(data, 'read', 'start',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(data),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                FileLogStoreAdaptor.appendFileOperation(path, 'read', 'start', 'content', this.getSandbox(), iid);
                const callback = args[args.length - 1] as LastParameter<typeof fs.appendFile>;
                const asyncId = asyncHooks.executionAsyncId();
                this.addRegistrationInfo(callback, {
                    register: f,
                    callback: () =>
                    {
                        if (isBufferLike(data))
                        {
                            BufferLogStore.appendBufferOperation(data, 'read', 'finish',
                                BufferLogStore.getArrayBufferRangeOfArrayBufferView(data),
                                getSourceCodeInfoFromIid(iid, this.getSandbox()));
                        }
                        FileLogStoreAdaptor.appendFileOperation(path, 'write', 'finish', 'content', this.getSandbox(), iid);
                    },
                    registerAsyncId: asyncId,
                });

            }
            else if (f === fs.close)
            {
                const [fd] = args as Parameters<typeof fs.close>;
                const callback = args[args.length - 1] as LastParameter<typeof fs.close>;
                if (callback)
                {
                    const asyncId = asyncHooks.executionAsyncId();
                    this.addRegistrationInfo(callback, {
                        register: f,
                        callback: () =>
                        {
                            FileLogStore.deleteFd(fd);
                        },
                        registerAsyncId: asyncId,
                    });
                }
                else
                {
                    FileLogStore.deleteFd(fd);
                }
            }
            else if (f === fs.copyFile
                || f === fs.cp)
            {
                const [src, dst] = args as Parameters<typeof fs.copyFile
                    | typeof fs.cp>;
                FileLogStoreAdaptor.appendFileOperation(src, 'read', 'start', 'content', this.getSandbox(), iid);
                FileLogStoreAdaptor.appendFileOperation(dst, 'read', 'start', 'stat', this.getSandbox(), iid);
                FileLogStoreAdaptor.appendFileOperation(dst, 'read', 'start', 'content', this.getSandbox(), iid);
                const callback = args[args.length - 1] as LastParameter<typeof fs.copyFile
                    | typeof fs.cp>;
                const asyncId = asyncHooks.executionAsyncId();
                this.addRegistrationInfo(callback, {
                    register: f,
                    callback: () =>
                    {
                        FileLogStoreAdaptor.appendFileOperation(src, 'read', 'finish', 'content', this.getSandbox(), iid);
                        FileLogStoreAdaptor.appendFileOperation(dst, 'write', 'finish', 'stat', this.getSandbox(), iid);
                        FileLogStoreAdaptor.appendFileOperation(dst, 'write', 'finish', 'content', this.getSandbox(), iid);
                    },
                    registerAsyncId: asyncId,
                });
            }
            else if (f === fs.rename)
            {
                const [src, dst] = args as Parameters<typeof fs.rename>;
                FileLogStoreAdaptor.appendFileOperation(src, 'read', 'start', 'content', this.getSandbox(), iid);
                FileLogStoreAdaptor.appendFileOperation(dst, 'read', 'start', 'content', this.getSandbox(), iid);
                FileLogStoreAdaptor.appendFileOperation(src, 'read', 'start', 'stat', this.getSandbox(), iid);
                FileLogStoreAdaptor.appendFileOperation(dst, 'read', 'start', 'stat', this.getSandbox(), iid);
                const callback = args[args.length - 1] as LastParameter<typeof fs.rename>;
                const asyncId = asyncHooks.executionAsyncId();

                this.addRegistrationInfo(callback, {
                    register: f,
                    callback: () =>
                    {
                        FileLogStoreAdaptor.appendFileOperation(src, 'write', 'finish', 'stat', this.getSandbox(), iid);
                        FileLogStoreAdaptor.appendFileOperation(dst, 'write', 'finish', 'stat', this.getSandbox(), iid);
                        FileLogStoreAdaptor.appendFileOperation(src, 'write', 'finish', 'content', this.getSandbox(), iid);
                        FileLogStoreAdaptor.appendFileOperation(dst, 'write', 'finish', 'content', this.getSandbox(), iid);
                    },
                    registerAsyncId: asyncId,
                });
            }
            else if (f === fs.ftruncate)
            {
                const [fd] = args as Parameters<typeof fs.ftruncate>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'read', 'start', 'content', this.getSandbox(), iid);
                const callback = args[args.length - 1] as LastParameter<typeof fs.ftruncate>;
                const asyncId = asyncHooks.executionAsyncId();
                this.addRegistrationInfo(callback, {
                    register: f,
                    callback: () => FileLogStoreAdaptor.appendFileOperation(fd, 'write', 'finish', 'content', this.getSandbox(), iid),
                    registerAsyncId: asyncId,
                });
            }
            else if (f === fs.fchmod
                || f === fs.fchown)
            {
                const [fd] = args as Parameters<typeof fs.fchmod
                    | typeof fs.fchown>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'read', 'start', 'stat', this.getSandbox(), iid);
                const callback = args[args.length - 1] as LastParameter<typeof fs.fchmod
                    | typeof fs.fchown>;
                const asyncId = asyncHooks.executionAsyncId();
                this.addRegistrationInfo(callback, {
                    register: f,
                    callback: () => FileLogStoreAdaptor.appendFileOperation(fd, 'write', 'finish', 'stat', this.getSandbox(), iid),
                    registerAsyncId: asyncId,
                });
            }
            else if (f === fs.mkdir
                || f === fs.rmdir
                || f === fs.rm
                || f === fs.unlink)
            {
                const [path] = args as Parameters<typeof fs.mkdir
                    | typeof fs.rmdir
                    | typeof fs.rm
                    | typeof fs.unlink>;
                FileLogStoreAdaptor.appendFileOperation(path, 'read', 'start', 'stat', this.getSandbox(), iid);
                FileLogStoreAdaptor.appendFileOperation(path, 'read', 'start', 'content', this.getSandbox(), iid);
                const callback = args[args.length - 1] as LastParameter<typeof fs.mkdir
                    | typeof fs.rmdir
                    | typeof fs.rm
                    | typeof fs.unlink>;
                const asyncId = asyncHooks.executionAsyncId();
                this.addRegistrationInfo(callback, {
                    register: f,
                    callback: () =>
                    {
                        FileLogStoreAdaptor.appendFileOperation(path, 'write', 'finish', 'stat', this.getSandbox(), iid);
                        FileLogStoreAdaptor.appendFileOperation(path, 'write', 'finish', 'content', this.getSandbox(), iid);
                    },
                    registerAsyncId: asyncId,
                });
            }
            else if (f === fs.truncate)
            {
                const [path] = args as Parameters<typeof fs.truncate>;
                FileLogStoreAdaptor.appendFileOperation(path, 'read', 'start', 'content', this.getSandbox(), iid);
                const callback = args[args.length - 1] as LastParameter<typeof fs.truncate>;
                const asyncId = asyncHooks.executionAsyncId();
                this.addRegistrationInfo(callback, {
                    register: f,
                    callback: () => FileLogStoreAdaptor.appendFileOperation(path, 'write', 'finish', 'content', this.getSandbox(), iid),
                    registerAsyncId: asyncId,
                });
            }
            else if (f === fs.chmod
                || f === fs.chown)
            {
                const [path] = args as Parameters<typeof fs.chmod>;
                FileLogStoreAdaptor.appendFileOperation(path, 'read', 'start', 'stat', this.getSandbox(), iid);
                const callback = args[args.length - 1] as LastParameter<typeof fs.chmod>;
                const asyncId = asyncHooks.executionAsyncId();
                this.addRegistrationInfo(callback, {
                    register: f,
                    callback: () => FileLogStoreAdaptor.appendFileOperation(path, 'write', 'finish', 'stat', this.getSandbox(), iid),
                    registerAsyncId: asyncId,
                });
            }
            else if (f === fs.mkdtemp)
            {
                const callback = args[args.length - 1] as LastParameter<typeof fs.mkdtemp>;
                const asyncId = asyncHooks.executionAsyncId();
                this.addRegistrationInfo(callback, {register: f, registerAsyncId: asyncId});
            }
            else if (f === fs.open)
            {
                const [filePath, flags] = args as Parameters<typeof fs.open>;

                const fileWillBeCreatedOrTruncated = willFileBeCreatedOrTruncated(flags);
                if (fileWillBeCreatedOrTruncated)
                {
                    FileLogStoreAdaptor.appendFileOperation(filePath, 'write', 'start', 'content', this.getSandbox(), iid);
                }

                const callback = args[args.length - 1] as LastParameter<typeof fs.open>;
                const asyncId = asyncHooks.executionAsyncId();
                this.addRegistrationInfo(callback, {
                    register: f, filePathLike: filePath, registerAsyncId: asyncId,
                    callback: () =>
                    {
                        if (fileWillBeCreatedOrTruncated)
                        {
                            FileLogStoreAdaptor.appendFileOperation(filePath, 'write', 'finish', 'content', this.getSandbox(), iid);
                        }
                    },
                });

            }
            else if (f === fs.read)
            {
                const fd = args[0] as Parameters<typeof fs.read>[0];
                const callback = args[args.length - 1] as LastParameter<typeof fs.read>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'read', 'start', 'content', this.getSandbox(), iid);
                const asyncId = asyncHooks.executionAsyncId();
                this.addRegistrationInfo(callback, {register: f, registerAsyncId: asyncId});
            }
            else if (f === fs.readdir)
            {
                const [path] = args as Parameters<typeof fs.readdir>;
                FileLogStoreAdaptor.appendFileOperation(path, 'read', 'start', 'content', this.getSandbox(), iid);
                const callback = args[args.length - 1] as LastParameter<typeof fs.readdir>;
                const asyncId = asyncHooks.executionAsyncId();
                this.addRegistrationInfo(callback, {
                    register: f,
                    callback: () => FileLogStoreAdaptor.appendFileOperation(path, 'read', 'finish', 'content', this.getSandbox(), iid),
                    registerAsyncId: asyncId,
                });
            }
            else if (f === fs.access
                || f === fs.exists
                || f === fs.stat)
            {
                const [path] = args as Parameters<typeof fs.access
                    | typeof fs.exists
                    | typeof fs.stat>;
                FileLogStoreAdaptor.appendFileOperation(path, 'read', 'start', 'stat', this.getSandbox(), iid);
                const callback = args[args.length - 1] as LastParameter<typeof fs.access
                    | typeof fs.exists
                    | typeof fs.stat>;
                const asyncId = asyncHooks.executionAsyncId();
                this.addRegistrationInfo(callback, {
                    register: f,
                    callback: () => FileLogStoreAdaptor.appendFileOperation(path, 'read', 'finish', 'stat', this.getSandbox(), iid),
                    registerAsyncId: asyncId,
                });
            }
            else if (f === fs.readFile)
            {
                const path = args[0] as Parameters<typeof fs.readFile>[0];
                const callback = args[args.length - 1] as LastParameter<typeof fs.readFile>;
                FileLogStoreAdaptor.appendFileOperation(path, 'read', 'start', 'content', this.getSandbox(), iid);
                const asyncId = asyncHooks.executionAsyncId();
                this.addRegistrationInfo(callback, {
                    register: f,
                    callback: () => FileLogStoreAdaptor.appendFileOperation(path, 'read', 'finish', 'content', this.getSandbox(), iid),
                    registerAsyncId: asyncId,
                });
            }
            else if (f === fs.readv)
            {
                const [fd, buffers] = args as Parameters<typeof fs.readv>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'read', 'start', 'content', this.getSandbox(), iid);
                buffers.forEach(buffer =>
                    BufferLogStore.appendBufferOperation(buffer.buffer, 'read', 'start',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(buffer),
                        this.getSandbox(), iid));
                const callback = args[args.length - 1] as LastParameter<typeof fs.readv>;
                const asyncId = asyncHooks.executionAsyncId();
                this.addRegistrationInfo(callback, {
                    register: f,
                    callback: () =>
                    {
                        FileLogStoreAdaptor.appendFileOperation(fd, 'read', 'finish', 'content', this.getSandbox(), iid);
                        buffers.forEach(buffer =>
                            BufferLogStore.appendBufferOperation(buffer.buffer, 'write', 'finish',
                                BufferLogStore.getArrayBufferRangeOfArrayBufferView(buffer),
                                this.getSandbox(), iid));
                    },
                    registerAsyncId: asyncId,
                });
            }
            else if (f === fs.write
                || f === fs.writeFile)
            {
                const [path, data] = args as Parameters<typeof fs.write
                    | typeof fs.writeFile>;
                if (isBufferLike(data))
                {
                    BufferLogStore.appendBufferOperation(data, 'read', 'start',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(data),
                        this.getSandbox(), iid);
                }
                else if (isObject(data))    // not precise
                {
                    ObjectLogStore.appendObjectOperation(data, 'read', Object.keys(data), false, this.getSandbox(), iid);
                }
                const callback = args[args.length - 1] as LastParameter<typeof fs.write
                    | typeof fs.writeFile>;
                FileLogStoreAdaptor.appendFileOperation(path, 'read', 'start', 'content', this.getSandbox(), iid);
                const asyncId = asyncHooks.executionAsyncId();
                this.addRegistrationInfo(callback, {
                    register: f,
                    callback: () =>
                    {
                        if (isBufferLike(data))
                        {
                            BufferLogStore.appendBufferOperation(data, 'read', 'finish',
                                BufferLogStore.getArrayBufferRangeOfArrayBufferView(data),
                                this.getSandbox(), iid);
                        }
                        else if (isObject(data))
                        {
                            ObjectLogStore.appendObjectOperation(data, 'read', Object.keys(data), false, this.getSandbox(), iid);
                        }
                        FileLogStoreAdaptor.appendFileOperation(path, 'write', 'finish', 'content', this.getSandbox(), iid);
                    },
                    registerAsyncId: asyncId,
                });
            }
            else if (f === fs.writev)
            {
                const [fd, buffers] = args as Parameters<typeof fs.writev>;
                buffers.forEach(buffer =>
                    BufferLogStore.appendBufferOperation(buffer.buffer, 'read', 'start',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(buffer),
                        this.getSandbox(), iid));
                const callback = args[args.length - 1] as LastParameter<typeof fs.writev>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'read', 'start', 'content', this.getSandbox(), iid);
                const asyncId = asyncHooks.executionAsyncId();
                this.addRegistrationInfo(callback, {
                    register: f,
                    callback: () =>
                    {
                        buffers.forEach(buffer =>
                            BufferLogStore.appendBufferOperation(buffer.buffer, 'read', 'finish',
                                BufferLogStore.getArrayBufferRangeOfArrayBufferView(buffer),
                                this.getSandbox(), iid));
                        FileLogStoreAdaptor.appendFileOperation(fd, 'write', 'finish', 'content', this.getSandbox(), iid);
                    },
                    registerAsyncId: asyncId,
                });

            }
            else if (f === fs.fstat)
            {
                const [fd] = args as Parameters<typeof fs.fstat>;
                const callback = args[args.length - 1] as LastParameter<typeof fs.fstat>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'read', 'start', 'stat', this.getSandbox(), iid);
                const asyncId = asyncHooks.executionAsyncId();
                this.addRegistrationInfo(callback, {
                    register: f,
                    callback: () => FileLogStoreAdaptor.appendFileOperation(fd, 'read', 'finish', 'stat', this.getSandbox(), iid),
                    registerAsyncId: asyncId,
                });
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.functionEnter = (iid, f, _dis, args) =>
        {
            const startTimestamp = Date.now();
            const registrationInfos = this.callbackToRegistrationInfos.get(f);
            if (registrationInfos !== undefined && registrationInfos.length !== 0)
            {
                const currentAsyncContext = AsyncContextLogStore.getAsyncContextFromAsyncId(asyncHooks.executionAsyncId());
                const currentAsyncContextAsyncIds = currentAsyncContext.getAsyncContextChainAsyncIds();
                // Use asyncId chain to match correct RegistrationInfo. Not strictly precise but should be enough
                const registrationInfoIndex = registrationInfos.findIndex(({registerAsyncId}) => currentAsyncContextAsyncIds.has(registerAsyncId));
                assert.ok(registrationInfoIndex !== -1);
                const {register, callback, filePathLike} = registrationInfos[registrationInfoIndex]!;
                // registrationInfos won't be long so should be ok
                registrationInfos.splice(registrationInfoIndex, 1);
                const err = args[0];
                if (callback && !err)
                {
                    callback();
                }

                if (register === fs.open)
                {
                    assert.ok(filePathLike !== undefined);
                    const err = args[0];
                    const fd = args[1];
                    if (err === null)
                    {
                        assert.ok(typeof fd === 'number');
                        FileLogStore.addFd(fd, filePathLike, getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                }
                else if (register === fs.mkdtemp)
                {
                    const err = args[0];
                    const directory = args[1];
                    if (err === null)
                    {
                        assert.ok(typeof directory === 'string');
                        FileLogStoreAdaptor.appendFileOperation(directory, 'write', 'finish', 'stat', this.getSandbox(), iid);
                        FileLogStoreAdaptor.appendFileOperation(directory, 'write', 'finish', 'content', this.getSandbox(), iid);
                    }
                }
                else if (register === fs.read)
                {
                    const err = args[0];
                    const buffer = args[2];
                    if (err !== null)
                    {
                        assert.ok(isBufferLike(buffer));
                        BufferLogStore.appendBufferOperation(buffer, 'write', 'finish',
                            BufferLogStore.getArrayBufferRangeOfArrayBufferView(buffer),
                            this.getSandbox(), iid);
                    }
                }
                else if (register === fs.readFile)
                {
                    const err = args[0];
                    const data = args[1];
                    if (err !== null)
                    {
                        if (isBufferLike(data))
                        {
                            BufferLogStore.appendBufferOperation(data, 'write', 'finish',
                                BufferLogStore.getArrayBufferRangeOfArrayBufferView(data),
                                this.getSandbox(), iid);
                        }
                    }
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`FsAsync: ${this.timeConsumed / 1000}s`);
            }
        };
    }

    private addRegistrationInfo(callback: Function, registrationInfo: RegistrationInfo)
    {
        // Function provided by functionEnter() is unbound, so we only log unbound version function
        const unboundCallback = getUnboundFunction(callback);
        const registrationInfos = this.callbackToRegistrationInfos.get(unboundCallback);
        if (registrationInfos === undefined)
        {
            this.callbackToRegistrationInfos.set(unboundCallback, [registrationInfo]);
        }
        else
        {
            registrationInfos.push(registrationInfo);
        }
    }
}