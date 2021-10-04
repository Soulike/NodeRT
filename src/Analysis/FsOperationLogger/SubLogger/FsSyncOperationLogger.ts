// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../../Type/nodeprof';
import fs from 'fs';
import {FileLogStoreAdaptor} from '../FileLogStoreAdaptor';
import {getSourceCodeInfoFromIid, isBufferLike} from '../../../Util';
import {BufferLogStore} from '../../../LogStore/BufferLogStore';
import {FileLogStore} from '../../../LogStore/FileLogStore';
import {isObject} from 'lodash';
import {ObjectLogStore} from '../../../LogStore/ObjectLogStore';
import {Readable, Writable} from 'stream';
import {strict as assert} from 'assert';
import {StreamLogStore} from '../../../LogStore/StreamLogStore';

export class FsSyncOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public endExecution: Hooks['endExecution'] | undefined;

    private timeConsumed: number;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.timeConsumed = 0;

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, _base, args, result) =>
        {
            const startTimestamp = Date.now();

            if (f === fs.appendFileSync)
            {
                const [path, data] = args as Parameters<typeof fs.appendFileSync>;
                FileLogStoreAdaptor.appendFileOperation(path, 'write', this.getSandbox(), iid);
                if (isBufferLike(data))
                {
                    BufferLogStore.appendBufferOperation(data, 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
            else if (f === fs.closeSync)
            {
                const [fd] = args as Parameters<typeof fs.closeSync>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'write', this.getSandbox(), iid);
                FileLogStore.deleteFd(fd);
            }
            else if (f === fs.copyFileSync
                || f === fs.cpSync
                || f === fs.renameSync)
            {
                const [src, dst] = args as Parameters<typeof fs.copyFileSync
                    | typeof fs.cpSync
                    | typeof fs.renameSync>;
                FileLogStoreAdaptor.appendFileOperation(src, 'read', this.getSandbox(), iid);
                FileLogStoreAdaptor.appendFileOperation(dst, 'write', this.getSandbox(), iid);
            }
            else if (f === fs.ftruncateSync
                || f === fs.fchmodSync
                || f === fs.fchownSync)
            {
                const [fd] = args as Parameters<typeof fs.ftruncateSync>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'write', this.getSandbox(), iid);
            }
            else if (f === fs.mkdirSync
                || f === fs.rmdirSync
                || f === fs.rmSync
                || f === fs.truncateSync
                || f === fs.unlinkSync
                || f === fs.chmodSync
                || f === fs.chownSync)
            {
                const [path] = args as Parameters<typeof fs.mkdirSync
                    | typeof fs.rmdirSync
                    | typeof fs.rmSync
                    | typeof fs.truncateSync
                    | typeof fs.unlinkSync
                    | typeof fs.chmodSync
                    | typeof fs.chownSync>;
                FileLogStoreAdaptor.appendFileOperation(path, 'write', this.getSandbox(), iid);
            }
            else if (f === fs.mkdtempSync)
            {
                const path = result as ReturnType<typeof fs.mkdtempSync>;
                FileLogStoreAdaptor.appendFileOperation(path, 'write', this.getSandbox(), iid);
            }
            else if (f === fs.openSync)
            {
                const [path] = args as Parameters<typeof fs.openSync>;
                const fd = result as ReturnType<typeof fs.openSync>;
                FileLogStore.addFd(fd, path);
            }
            else if (f === fs.readdirSync
                || f === fs.accessSync
                || f === fs.existsSync
                || f === fs.fstatSync)
            {
                const [path] = args as Parameters<typeof fs.readdirSync>;
                FileLogStoreAdaptor.appendFileOperation(path, 'read', this.getSandbox(), iid);
            }
            else if (f === fs.readFileSync)
            {
                const [fdOrFilePath] = args as Parameters<typeof fs.readFileSync>;
                FileLogStoreAdaptor.appendFileOperation(fdOrFilePath, 'read', this.getSandbox(), iid);
                const ret = result as ReturnType<typeof fs.readFileSync>;
                if (isBufferLike(ret))
                {
                    BufferLogStore.appendBufferOperation(ret, 'write', this.getSandbox(), iid);
                }
            }
            else if (f === fs.readSync)
            {
                const [fd, buffer] = args as Parameters<typeof fs.readSync>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'read', this.getSandbox(), iid);
                BufferLogStore.appendBufferOperation(buffer, 'write',
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (f === fs.readvSync)
            {
                const [fd, buffers] = args as Parameters<typeof fs.readvSync>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'read', this.getSandbox(), iid);
                buffers.forEach(buffer =>
                    BufferLogStore.appendBufferOperation(buffer.buffer, 'write', this.getSandbox(), iid));
            }
            else if (f === fs.writeSync
                || f === fs.writeFileSync)
            {
                const [path, data] = args as Parameters<typeof fs.writeSync
                    | typeof fs.writeFileSync>;
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
            else if (f === fs.writevSync)
            {
                const [fd, buffers] = args as Parameters<typeof fs.writevSync>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'write', this.getSandbox(), iid);
                buffers.forEach(buffer =>
                    BufferLogStore.appendBufferOperation(buffer.buffer, 'read', this.getSandbox(), iid));
            }
            else if (f === fs.createReadStream || f === fs.createWriteStream)
            {
                assert.ok(result instanceof Readable || result instanceof Writable);
                StreamLogStore.appendStreamOperation(result, 'write', this.getSandbox(), iid);
            }
            else if (f === fs.fstatSync)
            {
                const [fd] = args as Parameters<typeof fs.fstat>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'read', this.getSandbox(), iid);
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            console.log(`FsSync: ${this.timeConsumed / 1000}s`);
        };
    }
}