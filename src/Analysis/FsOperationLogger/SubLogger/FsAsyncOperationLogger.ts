// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import fs from 'fs';
import {isObject} from 'lodash';
import {BufferLogStore} from '../../../LogStore/BufferLogStore';
import {FileLogStore} from '../../../LogStore/FileLogStore';
import {ObjectLogStore} from '../../../LogStore/ObjectLogStore';
import {Analysis, Hooks, Sandbox} from '../../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike, shouldBeVerbose} from '../../../Util';
import {BufferLike} from '../../Type/BufferLike';
import {FileLogStoreAdaptor} from '../FileLogStoreAdaptor';

export class FsAsyncOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public functionEnter: Hooks['functionEnter'] | undefined;
    public endExecution: Hooks['endExecution'] | undefined;

    private timeConsumed: number;

    // Log information of callback apis
    private readonly callbackToFilePathOrBuffer: WeakMap<Function, { register: Function, filePathOrBuffer?: string | URL | BufferLike; }>;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.callbackToFilePathOrBuffer = new WeakMap();
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
                FileLogStoreAdaptor.appendFileOperation(path, 'write', this.getSandbox(), iid);
                if (isBufferLike(data))
                {
                    BufferLogStore.appendBufferOperation(data, 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
            else if (f === fs.close)
            {
                const [fd] = args as Parameters<typeof fs.close>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'write', this.getSandbox(), iid);
                FileLogStore.deleteFd(fd);
            }
            else if (f === fs.copyFile
                || f === fs.cp
                || f === fs.rename)
            {
                const [src, dst] = args as Parameters<typeof fs.copyFile
                    | typeof fs.cp
                    | typeof fs.rename>;
                FileLogStoreAdaptor.appendFileOperation(src, 'read', this.getSandbox(), iid);
                FileLogStoreAdaptor.appendFileOperation(dst, 'write', this.getSandbox(), iid);
            }
            else if (f === fs.ftruncate
                || f === fs.fchmod
                || f === fs.fchown)
            {
                const [fd] = args as Parameters<typeof fs.ftruncate
                    | typeof fs.fchmod
                    | typeof fs.fchown>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'write', this.getSandbox(), iid);
            }
            else if (f === fs.mkdir
                || f === fs.rmdir
                || f === fs.rm
                || f === fs.truncate
                || f === fs.unlink
                || f === fs.chmod
                || f === fs.chown)
            {
                const [path] = args as Parameters<typeof fs.mkdir
                    | typeof fs.rmdir
                    | typeof fs.rm
                    | typeof fs.truncate
                    | typeof fs.unlink
                    | typeof fs.chmod>;
                FileLogStoreAdaptor.appendFileOperation(path, 'write', this.getSandbox(), iid);
            }
            else if (f === fs.mkdtemp)
            {
                const callback = args[args.length - 1] as LastParameter<typeof fs.mkdtemp>;
                this.callbackToFilePathOrBuffer.set(callback, {register: f});
            }
            else if (f === fs.open)
            {
                const filePath = args[0] as Parameters<typeof fs.open>[0];
                const callback = args[args.length - 1] as LastParameter<typeof fs.open>;
                this.callbackToFilePathOrBuffer.set(callback, {register: f, filePathOrBuffer: filePath});
            }
            else if (f === fs.read)
            {
                const fd = args[0] as Parameters<typeof fs.read>[0];
                const callback = args[args.length - 1] as LastParameter<typeof fs.read>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'read', this.getSandbox(), iid);
                this.callbackToFilePathOrBuffer.set(callback, {register: fs.read});
            }
            else if (f === fs.readdir
                || f === fs.access
                || f === fs.exists
                || f === fs.stat)
            {
                const [path] = args as Parameters<typeof fs.readdir
                    | typeof fs.access
                    | typeof fs.exists
                    | typeof fs.stat>;
                FileLogStoreAdaptor.appendFileOperation(path, 'read', this.getSandbox(), iid);
            }
            else if (f === fs.readFile)
            {
                const path = args[0] as Parameters<typeof fs.readFile>[0];
                const callback = args[args.length - 1] as LastParameter<typeof fs.readFile>;
                FileLogStoreAdaptor.appendFileOperation(path, 'read', this.getSandbox(), iid);
                this.callbackToFilePathOrBuffer.set(callback, {register: fs.readFile});
            }
            else if (f === fs.readv)
            {
                const [fd, buffers] = args as Parameters<typeof fs.readv>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'read', this.getSandbox(), iid);
                buffers.forEach(buffer =>
                    BufferLogStore.appendBufferOperation(buffer.buffer, 'write', this.getSandbox(), iid));
            }
            else if (f === fs.write
                || f === fs.writeFile)
            {
                const [path, data] = args as Parameters<typeof fs.write
                    | typeof fs.writeFile>;
                FileLogStoreAdaptor.appendFileOperation(path, 'write', this.getSandbox(), iid);
                if (isBufferLike(data))
                {
                    BufferLogStore.appendBufferOperation(data, 'read', this.getSandbox(), iid);
                }
                else if (isObject(data))
                {
                    ObjectLogStore.appendObjectOperation(data, 'read', null, this.getSandbox(), iid);
                }
            }
            else if (f === fs.writev)
            {
                const [fd, buffers] = args as Parameters<typeof fs.writev>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'write', this.getSandbox(), iid);
                buffers.forEach(buffer =>
                    BufferLogStore.appendBufferOperation(buffer.buffer, 'read', this.getSandbox(), iid));
            }
            else if (f === fs.fstat)
            {
                const [fd] = args as Parameters<typeof fs.fstat>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'read', this.getSandbox(), iid);
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.functionEnter = (iid, f, _dis, args) =>
        {
            const startTimestamp = Date.now();

            const info = this.callbackToFilePathOrBuffer.get(f);
            if (info !== undefined)
            {
                const {register, filePathOrBuffer} = info;
                if (register === fs.open)
                {
                    assert.ok(filePathOrBuffer !== undefined);
                    const err = args[0];
                    const fd = args[1];
                    if (err === null)
                    {
                        assert.ok(typeof fd === 'number');
                        FileLogStore.addFd(fd, filePathOrBuffer);
                    }
                }
                else if (register === fs.mkdtemp)
                {
                    const err = args[0];
                    const directory = args[1];
                    if (err === null)
                    {
                        assert.ok(typeof directory === 'string');
                        FileLogStoreAdaptor.appendFileOperation(directory, 'write', this.getSandbox(), iid);
                    }
                }
                else if (register === fs.read)
                {
                    const err = args[0];
                    const buffer = args[2];
                    if (err !== null)
                    {
                        assert.ok(isBufferLike(buffer));
                        BufferLogStore.appendBufferOperation(buffer, 'write', this.getSandbox(), iid);
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
                            BufferLogStore.appendBufferOperation(data, 'write', this.getSandbox(), iid);
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
}