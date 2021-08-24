// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {FileLogStore} from '../../LogStore/FileLogStore';
import {FileHandle} from 'fs/promises';
import fs, {PathLike} from 'fs';
import {strict as assert} from 'assert';
import {isBufferLike, isURL} from '../../Util';
import {isObject} from 'lodash';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {BufferLike} from '../Type/BufferLike';
import {BufferLogStore} from '../../LogStore/BufferLogStore';

export class FileOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public functionEnter: Hooks['functionEnter'] | undefined;

    // Log information of callback apis
    private readonly callbackToFilePathOrBuffer: Map<Function, {register: Function, filePathOrBuffer?: string | URL | BufferLike;}>;

    private readonly readApis: ReadonlySet<(path: string & URL & FileHandle & BufferLike, ...rest: any[]) => any>;
    private readonly writeApis: ReadonlySet<(path: PathLike & FileHandle & BufferLike, ...rest: any[]) => any>;
    private readonly readWriteApis: ReadonlySet<(src: PathLike & BufferLike, dist: PathLike & BufferLike, ...rest: any[]) => any>;

    private readonly fdReadApis: ReadonlySet<(fd: number, ...rest: any[]) => any>;
    private readonly fdWriteApis: ReadonlySet<(fd: number, ...rest: any[]) => any>;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.callbackToFilePathOrBuffer = new Map();

        this.readApis = new Set([
            fs.access,
            fs.createReadStream,
            fs.exists,
            fs.lstat,
            fs.readlink,
            fs.stat,

            fs.accessSync,
            fs.existsSync,
            fs.lstatSync,
            fs.readlinkSync,
            fs.statSync,
        ]);
        this.writeApis = new Set([
            fs.chmod,
            fs.chown,
            fs.createWriteStream,
            fs.lchmod,
            fs.lchown,
            fs.lutimes,
            fs.mkdir,
            fs.rmdir,
            fs.rm,
            fs.truncate,
            fs.unlink,

            fs.chmodSync,
            fs.chownSync,
            fs.lchmodSync,
            fs.lchownSync,
            fs.lutimesSync,
            fs.mkdirSync,
            fs.rmdirSync,
            fs.rmSync,
            fs.truncateSync,
            fs.unlinkSync,
        ]);
        this.readWriteApis = new Set([
            fs.copyFile,
            fs.link,
            fs.rename,
            fs.symlink,

            fs.copyFileSync,
            fs.linkSync,
            fs.renameSync,
            fs.symlinkSync,
        ]);

        this.fdReadApis = new Set([
            fs.fstat,
            fs.fstatSync,
        ]);
        this.fdWriteApis = new Set([
            fs.close,
            fs.fchmod,
            fs.fchown,
            fs.ftruncate,
            fs.futimes,

            fs.closeSync,
            fs.fchmodSync,
            fs.fchownSync,
            fs.ftruncateSync,
            fs.futimesSync,
        ]);

        this.registerHooks();
    }

    /**
     * Determine whether the operation is appended to BufferLogStore or FileLogStore
     * */
    public static appendOperation(fileHandle: FileHandle, type: 'read' | 'write', sandbox: Sandbox, iid: number): void;
    public static appendOperation(filePathLike: PathLike | BufferLike, type: 'read' | 'write', sandbox: Sandbox, iid: number): void;
    public static appendOperation(fd: number, type: 'read' | 'write', sandbox: Sandbox, iid: number): void;
    public static appendOperation(filePathLikeOrFdOrFileHandle: PathLike | number | BufferLike | FileHandle, type: 'read' | 'write', sandbox: Sandbox, iid: number): void;
    public static appendOperation(filePathLikeOrFdOrFileHandle: PathLike | number | BufferLike | FileHandle, type: 'read' | 'write', sandbox: Sandbox, iid: number)
    {
        if (isBufferLike(filePathLikeOrFdOrFileHandle))
        {
            const buffer = filePathLikeOrFdOrFileHandle;
            BufferLogStore.appendBufferOperation(buffer, type, sandbox, iid);
        }
        else if (typeof filePathLikeOrFdOrFileHandle === 'number')   // fd
        {
            const fd = filePathLikeOrFdOrFileHandle;
            const filePathOrBuffer = FileLogStore.getFilePathOrBufferFromFd(fd);
            if (isBufferLike(filePathOrBuffer))
            {
                const buffer = filePathOrBuffer;
                BufferLogStore.appendBufferOperation(buffer, type, sandbox, iid);
            }
            else if (typeof filePathOrBuffer === 'string')
            {
                const filePath = filePathOrBuffer;
                FileLogStore.appendFileOperation(filePath, type, sandbox, iid);
            }
            else
            {
                // ignore undefined one
            }
        }
        else if (isURL(filePathLikeOrFdOrFileHandle) || typeof filePathLikeOrFdOrFileHandle === 'string')
        {
            const filePathOrUrl = filePathLikeOrFdOrFileHandle;
            FileLogStore.appendFileOperation(filePathOrUrl, type, sandbox, iid);
        }
        else    // FileHandle
        {
            const fileHandle = filePathLikeOrFdOrFileHandle;
            FileOperationLogger.appendOperation(fileHandle.fd, type, sandbox, iid);
        }
    }

    protected override registerHooks(): void
    {
        /*
        * No need to specially log operations on `BufferLike`s. See `FileDeclaration`.
        * */
        this.invokeFun = (iid, f, base, args, result) =>
        {
            // @ts-ignore
            if (this.readApis.has(f))
            {
                const path = args[0] as PathLike | FileHandle;
                FileOperationLogger.appendOperation(path, 'read', this.getSandbox(), iid);
            }
            // @ts-ignore
            else if (this.writeApis.has(f))
            {
                const path = args[0] as PathLike | FileHandle;
                FileOperationLogger.appendOperation(path, 'write', this.getSandbox(), iid);
            }
            // @ts-ignore
            else if (this.readWriteApis.has(f))
            {
                const srcPath = args[0] as PathLike | FileHandle;
                const distPath = args[1] as PathLike | FileHandle;
                FileOperationLogger.appendOperation(srcPath, 'read', this.getSandbox(), iid);
                FileOperationLogger.appendOperation(distPath, 'write', this.getSandbox(), iid);
            }
            else if (f === fs.appendFile || f === fs.appendFileSync)
            {
                const [path, data] = args as Parameters<typeof fs.appendFile | typeof fs.appendFileSync>;
                FileOperationLogger.appendOperation(path, 'write', this.getSandbox(), iid);
                if (typeof data !== 'string')
                {
                    FileOperationLogger.appendOperation(data, 'read', this.getSandbox(), iid);
                }
            }
            else if (f === fs.writeFile || f === fs.writeFileSync)
            {
                const [path, data] = args as Parameters<typeof fs.writeFile | typeof fs.writeFileSync>;
                FileOperationLogger.appendOperation(path, 'write', this.getSandbox(), iid);
                if (isBufferLike(data))
                {
                    FileOperationLogger.appendOperation(data, 'read', this.getSandbox(), iid);
                }
                else if (isObject(data))
                {
                    ObjectLogStore.appendObjectOperation(data, 'read', this.getSandbox(), iid);
                }
            }
            else if (f === fs.mkdtempSync)
            {
                const filePath = result as ReturnType<typeof fs.mkdtempSync>;
                FileOperationLogger.appendOperation(filePath, 'write', this.getSandbox(), iid);
            }
            else if (f === fs.open)
            {
                const filePath = args[0] as Parameters<typeof fs.open>[0];
                const callback = args[args.length - 1] as LastParameter<typeof fs.open>;
                this.callbackToFilePathOrBuffer.set(callback, {register: f, filePathOrBuffer: filePath});  // later processed in functionEnter()
            }
            else if (f === fs.mkdtemp)
            {
                const callback = args[args.length - 1] as LastParameter<typeof fs.mkdtemp>;
                this.callbackToFilePathOrBuffer.set(callback, {register: f});  // later processed in functionEnter()
            }
            else if (f === fs.read)
            {
                const fd = args[0] as Parameters<typeof fs.read>[0];
                const callback = args[args.length - 1] as LastParameter<typeof fs.read>;
                FileOperationLogger.appendOperation(fd, 'read', this.getSandbox(), iid);
                this.callbackToFilePathOrBuffer.set(callback, {register: fs.read});
            }
            else if (f === fs.readSync)
            {
                const [fdOrFileHandle, buffer] = args as Parameters<typeof fs.readSync>;
                FileOperationLogger.appendOperation(fdOrFileHandle, 'read', this.getSandbox(), iid);
                FileOperationLogger.appendOperation(buffer, 'write', this.getSandbox(), iid);
            }
            else if (f === fs.readFile)
            {
                const path = args[0] as Parameters<typeof fs.readFile>[0];
                const callback = args[args.length - 1] as LastParameter<typeof fs.readFile>;
                FileOperationLogger.appendOperation(path, 'read', this.getSandbox(), iid);
                this.callbackToFilePathOrBuffer.set(callback, {register: fs.readFile});
            }
            else if (f === fs.readFileSync)
            {
                const [fdOrFilePath] = args as Parameters<typeof fs.readFileSync>;
                FileOperationLogger.appendOperation(fdOrFilePath, 'read', this.getSandbox(), iid);
                const ret = result as ReturnType<typeof fs.readFileSync>;
                if (isBufferLike(ret))
                {
                    FileOperationLogger.appendOperation(ret, 'write', this.getSandbox(), iid);
                }
            }
            else if (f === fs.readv || f === fs.readvSync)
            {
                const [fd, buffers] = args as Parameters<typeof fs.readv | typeof fs.readvSync>;
                FileOperationLogger.appendOperation(fd, 'read', this.getSandbox(), iid);
                buffers.forEach(buffer =>
                    FileOperationLogger.appendOperation(buffer, 'write', this.getSandbox(), iid));
            }
            else if (f === fs.readdir)
            {
                const path = args[0] as Parameters<typeof fs.readdir>[0];
                FileOperationLogger.appendOperation(path, 'read', this.getSandbox(), iid);
                const callback = args[args.length - 1] as LastParameter<typeof fs.readdir>;
                this.callbackToFilePathOrBuffer.set(callback, {register: fs.readdir});
            }
            else if (f === fs.readdirSync)
            {
                const fileList = result as ReturnType<typeof fs.readdirSync>;
                fileList.forEach(file =>
                {
                    if (isBufferLike(file))
                    {
                        BufferLogStore.appendBufferOperation(file, 'write', this.getSandbox(), iid);
                    }
                    else if (isObject(file))
                    {
                        ObjectLogStore.appendObjectOperation(file, 'write', this.getSandbox(), iid);
                    }
                });
            }
            else if (f === fs.write || f === fs.writeSync)
            {
                const [fdOrFileHandle, buffer] = args as Parameters<typeof fs.write | typeof fs.writeSync>;
                FileOperationLogger.appendOperation(fdOrFileHandle, 'write', this.getSandbox(), iid);
                if (isBufferLike(buffer))
                {
                    FileOperationLogger.appendOperation(buffer, 'read', this.getSandbox(), iid);
                }
            }
            else if (f === fs.writev || f === fs.writevSync)
            {
                const [fd, buffers] = args as Parameters<typeof fs.writev | typeof fs.writevSync>;
                FileOperationLogger.appendOperation(fd, 'write', this.getSandbox(), iid);
                buffers.forEach(buffer =>
                    FileOperationLogger.appendOperation(buffer, 'read', this.getSandbox(), iid));
            }
            // @ts-ignore
            else if (this.fdReadApis.has(f))
            {
                const fd = args[0];
                assert.ok(typeof fd === 'number');
                FileOperationLogger.appendOperation(fd, 'read', this.getSandbox(), iid);
            }
            // @ts-ignore
            else if (this.fdWriteApis.has(f))
            {
                const fd = args[0];
                assert.ok(typeof fd === 'number');
                FileOperationLogger.appendOperation(fd, 'write', this.getSandbox(), iid);
            }
            else if (f === fs.Dir.prototype.close || f === fs.Dir.prototype.closeSync)
            {
                assert.ok(base instanceof fs.Dir);
                FileOperationLogger.appendOperation(base.path, 'write', this.getSandbox(), iid);
            }
            else if (f === fs.Dir.prototype.read || f === fs.Dir.prototype.readSync)
            {
                assert.ok(base instanceof fs.Dir);
                FileOperationLogger.appendOperation(base.path, 'read', this.getSandbox(), iid);
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
                        FileOperationLogger.appendOperation(buffer, 'write', this.getSandbox(), iid);
                    }
                }
                else if (register === fs.readdir)
                {
                    const err = args[0];
                    const files = args[2];
                    if (err !== null)
                    {
                        assert.ok(Array.isArray(files));
                        ObjectLogStore.appendObjectOperation(files, 'write', this.getSandbox(), iid);
                        files.forEach(file =>
                        {
                            if (isBufferLike(file))
                            {
                                BufferLogStore.appendBufferOperation(file, 'write', this.getSandbox(), iid);
                            }
                            else if (isObject(file))
                            {
                                ObjectLogStore.appendObjectOperation(file, 'write', this.getSandbox(), iid);
                            }
                        });
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
                            FileOperationLogger.appendOperation(data, 'write', this.getSandbox(), iid);
                        }
                    }
                }
            }
        };
    }
}