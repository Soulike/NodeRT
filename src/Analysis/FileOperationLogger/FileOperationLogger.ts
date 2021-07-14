// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {FileLogStore} from '../../LogStore/FileLogStore';
import {FileHandle} from 'fs/promises';
import fs, {PathLike, promises as fsPromise} from 'fs';
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
    private readonly callbackToFilePathOrBuffer: Map<Function, { register: Function, filePathOrBuffer?: string | URL | BufferLike }>;

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
            fsPromise.access,
            fsPromise.lstat,
            fsPromise.readdir,
            fsPromise.readlink,
            fsPromise.stat,
            fsPromise.read,

            fs.access,
            fs.createReadStream,
            fs.exists,
            fs.lstat,
            fs.readdir,
            fs.readFile,
            fs.readlink,
            fs.stat,

            fs.accessSync,
            fs.existsSync,
            fs.lstatSync,
            fs.readdirSync,
            fs.readFileSync,
            fs.readlinkSync,
            fs.statSync,
        ]);
        this.writeApis = new Set([
            fsPromise.chmod,
            fsPromise.chown,
            fsPromise.lchmod,
            fsPromise.lchown,
            fsPromise.lutimes,
            fsPromise.mkdir,
            fsPromise.rmdir,
            fsPromise.rm,
            fsPromise.truncate,
            fsPromise.unlink,
            fsPromise.write,

            fs.appendFile,
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
            fs.writeFile,

            fs.appendFileSync,
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
            fs.writeFileSync,
        ]);
        this.readWriteApis = new Set([
            fsPromise.copyFile,
            fsPromise.link,
            fsPromise.rename,
            fsPromise.symlink,

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
            fs.read,
            fs.readv,

            fs.fstatSync,
            fs.readSync,
            fs.readvSync,
        ]);
        this.fdWriteApis = new Set([
            fs.close,
            fs.fchmod,
            fs.fchown,
            fs.ftruncate,
            fs.futimes,
            fs.write,
            fs.writev,

            fs.closeSync,
            fs.fchmodSync,
            fs.fchownSync,
            fs.ftruncateSync,
            fs.futimesSync,
            fs.writeSync,
            fs.writevSync,
        ]);

        this.registerHooks();
    }

    /**
     * Determine whether the operation is appended to BufferLogStore or FileLogStore
     * */
    private static appendOperation(filePathLike: PathLike | BufferLike | FileHandle, type: 'read' | 'write', sandbox: Sandbox, iid: number): void

    private static appendOperation(fd: number, type: 'read' | 'write', sandbox: Sandbox, iid: number): void

    private static appendOperation(filePathLikeOrFdOrFileHandle: PathLike | number | BufferLike | FileHandle, type: 'read' | 'write', sandbox: Sandbox, iid: number)
    {
        if (isBufferLike(filePathLikeOrFdOrFileHandle))
        {
            BufferLogStore.appendBufferOperation(filePathLikeOrFdOrFileHandle, type, sandbox, iid);
        }
        else if (typeof filePathLikeOrFdOrFileHandle === 'number')   // fd
        {
            const filePathOrBuffer = FileLogStore.getFilePathOrBufferFromFd(filePathLikeOrFdOrFileHandle);
            if (isBufferLike(filePathOrBuffer))
            {
                BufferLogStore.appendBufferOperation(filePathOrBuffer, type, sandbox, iid);
            }
            else if (typeof filePathOrBuffer === 'string')
            {
                FileLogStore.appendFileOperation(filePathOrBuffer, type, sandbox, iid);
            }
            else
            {
                // ignore undefined one
            }
        }
        else if (isURL(filePathLikeOrFdOrFileHandle) || typeof filePathLikeOrFdOrFileHandle === 'string')
        {
            FileLogStore.appendFileOperation(filePathLikeOrFdOrFileHandle, type, sandbox, iid);
        }
        else    // FileHandle
        {
            FileOperationLogger.appendOperation(filePathLikeOrFdOrFileHandle.fd, type, sandbox, iid);
        }
    }

    protected override registerHooks(): void
    {
        /*
        * No need to specially log operations on `BufferLike`s. See `FileDeclaration`.
        * */
        this.invokeFun = (iid, f, base, args, result) =>
        {
            // TODO: fs.Dir
            if (f === fsPromise.open)
            {
                assert.ok(result instanceof Promise);
                (<ReturnType<typeof fsPromise.open>>result).then((fileHandle) =>
                {
                    const filePathLike = args[0] as Parameters<typeof fsPromise.open>[0];
                    FileLogStore.addFd(fileHandle.fd, filePathLike);
                    FileLogStore.addFileHandle(fileHandle);
                });
            }
            else if (FileLogStore.getFileHandles().has(base as FileHandle))
            {
                const fileHandle = base as FileHandle;
                const fileHandleWriteMetaApis: ReadonlySet<Function> = new Set([
                    fileHandle.chmod,
                    fileHandle.chown,
                    fileHandle.close,
                    fileHandle.truncate,
                ]);

                if (f === fileHandle.read)
                {
                    FileOperationLogger.appendOperation(fileHandle, 'read', this.getSandbox(), iid);

                    const [bufferOrOptions] = args as Parameters<typeof fileHandle.read>;
                    if (isBufferLike(bufferOrOptions))
                    {
                        FileOperationLogger.appendOperation(bufferOrOptions, 'write', this.getSandbox(), iid);
                    }
                    else
                    {
                        const {buffer} = bufferOrOptions;
                        assert.ok(isBufferLike(bufferOrOptions));
                        FileOperationLogger.appendOperation(buffer, 'write', this.getSandbox(), iid);
                    }
                }
                else if (f === fileHandle.readFile)
                {
                    FileOperationLogger.appendOperation(fileHandle, 'read', this.getSandbox(), iid);
                    (result as ReturnType<typeof fileHandle.readFile>).then(bufferOrString =>
                    {
                        if (isBufferLike(bufferOrString))
                        {
                            FileOperationLogger.appendOperation(bufferOrString, 'write', this.getSandbox(), iid);
                        }
                    });
                }
                else if (f === fileHandle.readv)
                {
                    FileOperationLogger.appendOperation(fileHandle, 'read', this.getSandbox(), iid);

                    const [buffers] = args as Parameters<typeof fileHandle.readv>;
                    buffers.forEach(buffer => FileOperationLogger.appendOperation(buffer, 'write', this.getSandbox(), iid));
                }
                else if (f === fileHandle.write)
                {
                    FileOperationLogger.appendOperation(fileHandle, 'write', this.getSandbox(), iid);

                    const [data] = args as Parameters<typeof fileHandle.writeFile>;
                    if (isBufferLike(data))
                    {
                        FileOperationLogger.appendOperation(data, 'read', this.getSandbox(), iid);
                    }
                }
                else if (f === fileHandle.writeFile || f === fileHandle.appendFile)
                {
                    FileOperationLogger.appendOperation(fileHandle, 'write', this.getSandbox(), iid);

                    const [data] = args as Parameters<typeof fileHandle.writeFile>;
                    if (isBufferLike(data))
                    {
                        FileOperationLogger.appendOperation(data, 'read', this.getSandbox(), iid);
                    }
                    else if (isObject(data))
                    {
                        ObjectLogStore.appendObjectOperation(data, 'read', this.getSandbox(), iid);
                    }
                }
                else if (f === fileHandle.writev)
                {
                    FileOperationLogger.appendOperation(fileHandle, 'write', this.getSandbox(), iid);

                    const [buffers] = args as Parameters<typeof fileHandle.writev>;
                    buffers.forEach(buffer => FileOperationLogger.appendOperation(buffer, 'read', this.getSandbox(), iid));
                }
                else if (fileHandleWriteMetaApis.has(f))
                {
                    FileOperationLogger.appendOperation(fileHandle, 'write', this.getSandbox(), iid);
                }
            }
            // @ts-ignore
            else if (this.readApis.has(f))
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
            else if (f === fsPromise.appendFile)
            {
                const [path, data] = args as Parameters<typeof fsPromise.appendFile>;
                FileOperationLogger.appendOperation(path, 'write', this.getSandbox(), iid);
                if (typeof data !== 'string')
                {
                    FileOperationLogger.appendOperation(data, 'read', this.getSandbox(), iid);
                }
            }
            else if (f === fsPromise.writeFile)
            {
                const [path, data] = args as Parameters<typeof fsPromise.writeFile>;
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
            else if (f === fsPromise.mkdtemp)
            {
                (<ReturnType<typeof fsPromise.mkdtemp>>result).then((filePath) =>
                {
                    FileOperationLogger.appendOperation(filePath, 'write', this.getSandbox(), iid);
                });
            }
            else if (f === fsPromise.readFile)
            {
                const [path] = args as Parameters<typeof fsPromise.readFile>;
                FileOperationLogger.appendOperation(path, 'read', this.getSandbox(), iid);

                (<ReturnType<typeof fsPromise.readFile>>result).then((fileContent) =>
                {
                    if (isBufferLike(fileContent))
                    {
                        FileOperationLogger.appendOperation(fileContent, 'write', this.getSandbox(), iid);
                    }
                });
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
        };

        this.functionEnter = (_iid, f, _dis, args) =>
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
            }
        };
    }
}