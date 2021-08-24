// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {BufferLike} from '../Type/BufferLike';
import {strict as assert} from 'assert';
import {FileLogStore} from '../../LogStore/FileLogStore';
import {FileOperationLogger} from '.';
import {getSourceCodeInfoFromIid, isBufferLike} from '../../Util';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {isObject} from 'lodash';
import fs from 'fs';

export class FsAsyncOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public functionEnter: Hooks['functionEnter'] | undefined;

    // Log information of callback apis
    private readonly callbackToFilePathOrBuffer: WeakMap<Function, {register: Function, filePathOrBuffer?: string | URL | BufferLike;}>;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.callbackToFilePathOrBuffer = new WeakMap();

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, _base, args) =>
        {
            if (f === fs.appendFile)
            {
                const [path, data] = args as Parameters<typeof fs.appendFile>;
                FileOperationLogger.appendOperation(path, 'write', this.getSandbox(), iid);
                if (isBufferLike(data))
                {
                    BufferLogStore.appendBufferOperation(data, 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
            else if (f === fs.close)
            {
                const [fd] = args as Parameters<typeof fs.close>;
                FileLogStore.deleteFd(fd);
            }
            else if (f === fs.copyFile
                || f === fs.cp
                || f === fs.rename)
            {
                const [src, dst] = args as Parameters<
                    typeof fs.copyFile
                    | typeof fs.cp
                    | typeof fs.rename>;
                FileOperationLogger.appendOperation(src, 'read', this.getSandbox(), iid);
                FileOperationLogger.appendOperation(dst, 'write', this.getSandbox(), iid);
            }
            else if (f === fs.ftruncate)
            {
                const [fd] = args as Parameters<typeof fs.ftruncate>;
                FileOperationLogger.appendOperation(fd, 'write', this.getSandbox(), iid);
            }
            else if (f === fs.mkdir
                || f === fs.rmdir
                || f === fs.rm
                || f === fs.truncate
                || f === fs.unlink)
            {
                const [path] = args as Parameters<typeof fs.mkdir
                    | typeof fs.rmdir
                    | typeof fs.rm
                    | typeof fs.truncate
                    | typeof fs.unlink>;
                FileOperationLogger.appendOperation(path, 'write', this.getSandbox(), iid);
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
                FileOperationLogger.appendOperation(fd, 'read', this.getSandbox(), iid);
                this.callbackToFilePathOrBuffer.set(callback, {register: fs.read});
            }
            else if (f === fs.readdir)
            {
                const [path] = args as Parameters<typeof fs.readdir>;
                FileOperationLogger.appendOperation(path, 'read', this.getSandbox(), iid);
            }
            else if (f === fs.readFile)
            {
                const path = args[0] as Parameters<typeof fs.readFile>[0];
                const callback = args[args.length - 1] as LastParameter<typeof fs.readFile>;
                FileOperationLogger.appendOperation(path, 'read', this.getSandbox(), iid);
                this.callbackToFilePathOrBuffer.set(callback, {register: fs.readFile});
            }
            else if (f === fs.readv)
            {
                const [fd, buffers] = args as Parameters<typeof fs.readv>;
                FileOperationLogger.appendOperation(fd, 'read', this.getSandbox(), iid);
                buffers.forEach(buffer =>
                    BufferLogStore.appendBufferOperation(buffer.buffer, 'write', this.getSandbox(), iid));
            }
            else if (f === fs.write
                || f === fs.writeFile)
            {
                const [path, data] = args as Parameters<typeof fs.write
                    | typeof fs.writeFile>;
                FileOperationLogger.appendOperation(path, 'write', this.getSandbox(), iid);
                if (isBufferLike(data))
                {
                    BufferLogStore.appendBufferOperation(data, 'read', this.getSandbox(), iid);
                }
                else if (isObject(data))
                {
                    ObjectLogStore.appendObjectOperation(data, 'read', this.getSandbox(), iid);
                }
            }
            else if (f === fs.writev)
            {
                const [fd, buffers] = args as Parameters<typeof fs.writev>;
                FileOperationLogger.appendOperation(fd, 'write', this.getSandbox(), iid);
                buffers.forEach(buffer =>
                    BufferLogStore.appendBufferOperation(buffer.buffer, 'read', this.getSandbox(), iid));
            }
        };

        this.functionEnter = (iid, f, _dis, args) =>
        {
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
                        FileOperationLogger.appendOperation(directory, 'write', this.getSandbox(), iid);
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
        };
    }
}