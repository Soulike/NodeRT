// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import fs from 'fs';
import {isObject} from 'lodash';
import {Readable, Writable} from 'stream';
import {BufferLogStore} from '../../../LogStore/BufferLogStore';
import {FileLogStore} from '../../../LogStore/FileLogStore';
import {ObjectLogStore} from '../../../LogStore/ObjectLogStore';
import {StreamLogStore} from '../../../LogStore/StreamLogStore';
import {Analysis, Hooks, Sandbox} from '../../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike, shouldBeVerbose} from '../../../Util';
import {FileLogStoreAdaptor} from '../FileLogStoreAdaptor';

export class FsSyncOperationLogger extends Analysis
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

            if (f === fs.appendFileSync)
            {
                const [path, data] = args as Parameters<typeof fs.appendFileSync>;
                FileLogStoreAdaptor.appendFileOperation(path, 'write', 'finish', 'content', this.getSandbox(), iid);
                if (isBufferLike(data))
                {
                    BufferLogStore.appendBufferOperation(data, 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(data),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
            else if (f === fs.closeSync)
            {
                const [fd] = args as Parameters<typeof fs.closeSync>;
                FileLogStore.deleteFd(fd);
            }
            else if (f === fs.copyFileSync
                || f === fs.cpSync
                || f === fs.renameSync)
            {
                const [src, dst] = args as Parameters<typeof fs.copyFileSync
                    | typeof fs.cpSync
                    | typeof fs.renameSync>;
                FileLogStoreAdaptor.appendFileOperation(src, 'read', 'finish', 'content', this.getSandbox(), iid);
                FileLogStoreAdaptor.appendFileOperation(dst, 'write', 'finish', 'content', this.getSandbox(), iid);
            }
            else if (f === fs.ftruncateSync)
            {
                const [fd] = args as Parameters<typeof fs.ftruncateSync>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'write', 'finish', 'content', this.getSandbox(), iid);
            }
            else if (f === fs.fchmodSync
                || f === fs.fchownSync)
            {
                const [fd] = args as Parameters<typeof fs.ftruncateSync>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'write', 'finish', 'stat', this.getSandbox(), iid);
            }
            else if (f === fs.mkdirSync
                || f === fs.rmdirSync
                || f === fs.rmSync
                || f === fs.truncateSync
                || f === fs.unlinkSync)
            {
                const [path] = args as Parameters<typeof fs.mkdirSync
                    | typeof fs.rmdirSync
                    | typeof fs.rmSync
                    | typeof fs.truncateSync
                    | typeof fs.unlinkSync>;
                FileLogStoreAdaptor.appendFileOperation(path, 'write', 'finish', 'content', this.getSandbox(), iid);
            }
            else if (f === fs.chmodSync
                || f === fs.chownSync)
            {
                const [path] = args as Parameters<typeof fs.chmodSync
                    | typeof fs.chownSync>;
                FileLogStoreAdaptor.appendFileOperation(path, 'write', 'finish', 'stat', this.getSandbox(), iid);
            }
            else if (f === fs.mkdtempSync)
            {
                const path = result as ReturnType<typeof fs.mkdtempSync>;
                FileLogStoreAdaptor.appendFileOperation(path, 'write', 'finish', 'content', this.getSandbox(), iid);
            }
            else if (f === fs.openSync)
            {
                const [path] = args as Parameters<typeof fs.openSync>;
                const fd = result as ReturnType<typeof fs.openSync>;
                FileLogStore.addFd(fd, path, getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (f === fs.readdirSync)
            {
                const [path] = args as Parameters<typeof fs.readdirSync>;
                FileLogStoreAdaptor.appendFileOperation(path, 'read', 'finish', 'content', this.getSandbox(), iid);
            }
            else if (f === fs.accessSync
                || f === fs.existsSync
                || f === fs.fstatSync)
            {
                const [path] = args as Parameters<typeof fs.readdirSync>;
                FileLogStoreAdaptor.appendFileOperation(path, 'read', 'finish', 'stat', this.getSandbox(), iid);
            }
            else if (f === fs.readFileSync)
            {
                const [fdOrFilePath] = args as Parameters<typeof fs.readFileSync>;
                FileLogStoreAdaptor.appendFileOperation(fdOrFilePath, 'read', 'finish', 'content', this.getSandbox(), iid);
                const ret = result as ReturnType<typeof fs.readFileSync>;
                if (isBufferLike(ret))
                {
                    BufferLogStore.appendBufferOperation(ret, 'write', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(ret),
                        this.getSandbox(), iid);
                }
            }
            else if (f === fs.readSync)
            {
                const [fd, buffer] = args as Parameters<typeof fs.readSync>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'read', 'finish', 'content', this.getSandbox(), iid);
                BufferLogStore.appendBufferOperation(buffer, 'write', 'finish',
                    BufferLogStore.getArrayBufferRangeOfArrayBufferView(buffer),
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (f === fs.readvSync)
            {
                const [fd, buffers] = args as Parameters<typeof fs.readvSync>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'read', 'finish', 'content', this.getSandbox(), iid);
                buffers.forEach(buffer =>
                    BufferLogStore.appendBufferOperation(buffer.buffer, 'write', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(buffer),
                        this.getSandbox(), iid));
            }
            else if (f === fs.writeSync
                || f === fs.writeFileSync)
            {
                const [path, data] = args as Parameters<typeof fs.writeSync
                    | typeof fs.writeFileSync>;
                FileLogStoreAdaptor.appendFileOperation(path, 'write', 'finish', 'content', this.getSandbox(), iid);
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
            }
            else if (f === fs.writevSync)
            {
                const [fd, buffers] = args as Parameters<typeof fs.writevSync>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'write', 'finish', 'content', this.getSandbox(), iid);
                buffers.forEach(buffer =>
                    BufferLogStore.appendBufferOperation(buffer.buffer, 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(buffer),
                        this.getSandbox(), iid));
            }
            else if (f === fs.createReadStream)
            {
                const [path] = args as Parameters<typeof fs.createReadStream>;
                assert.ok(result instanceof Readable);
                FileLogStoreAdaptor.appendFileOperation(path, 'read', 'start', 'content', this.getSandbox(), iid);
                StreamLogStore.appendStreamOperation(result, 'write', 'construction', this.getSandbox(), iid);
                result.once('close', () =>
                {
                    FileLogStoreAdaptor.appendFileOperation(path, 'read', 'finish', 'content', this.getSandbox(), iid);
                });
            }
            else if (f === fs.createWriteStream)
            {
                const [path, opts] = args as Parameters<typeof fs.createWriteStream>;
                assert.ok(result instanceof Writable);
                let operationTypeOnStart: 'read'|'write' = 'read';
                if (opts === undefined
                    || typeof opts === 'string'
                    || opts.flags === undefined)    // 'w' by default
                {
                    operationTypeOnStart = 'write';
                }
                else
                {
                    operationTypeOnStart = opts.flags.includes('w') ? 'write' : 'read';
                }
                FileLogStoreAdaptor.appendFileOperation(path, operationTypeOnStart, 'start', 'content', this.getSandbox(), iid);
                StreamLogStore.appendStreamOperation(result, 'write', 'construction', this.getSandbox(), iid);
                result.once('close', () =>
                {
                    FileLogStoreAdaptor.appendFileOperation(path, 'write', 'finish', 'content', this.getSandbox(), iid);
                });
            }
            else if (f === fs.fstatSync)
            {
                const [fd] = args as Parameters<typeof fs.fstat>;
                FileLogStoreAdaptor.appendFileOperation(fd, 'read', 'finish', 'stat', this.getSandbox(), iid);
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`FsSync: ${this.timeConsumed / 1000}s`);
            }
        };
    }
}