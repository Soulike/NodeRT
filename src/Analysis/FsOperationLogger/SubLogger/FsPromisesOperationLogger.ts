// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../../Type/nodeprof';
import fsPromise from 'fs/promises';
import {FileLogStoreAdaptor} from '../FileLogStoreAdaptor';
import {getSourceCodeInfoFromIid, isBufferLike} from '../../../Util';
import {BufferLogStore} from '../../../LogStore/BufferLogStore';
import {FileLogStore} from '../../../LogStore/FileLogStore';
import {isObject} from 'lodash';
import {ObjectLogStore} from '../../../LogStore/ObjectLogStore';
import {Readable, Writable} from 'stream';
import {StreamLogStore} from '../../../LogStore/StreamLogStore';

export class FsPromisesOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, _base, args, result) =>
        {
            if (f === fsPromise.appendFile)
            {
                const [path, data] = args as Parameters<typeof fsPromise.appendFile>;
                FileLogStoreAdaptor.appendFileOperation(path, 'write', this.getSandbox(), iid);
                if (isBufferLike(data))
                {
                    BufferLogStore.appendBufferOperation(data, 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
            else if (f === fsPromise.copyFile
                || f === fsPromise.cp
                || f === fsPromise.rename)
            {
                const [src, dst] = args as Parameters<
                    typeof fsPromise.copyFile
                    | typeof fsPromise.cp
                    | typeof fsPromise.rename>;
                FileLogStoreAdaptor.appendFileOperation(src, 'read', this.getSandbox(), iid);
                FileLogStoreAdaptor.appendFileOperation(dst, 'write', this.getSandbox(), iid);
            }
            else if (f === fsPromise.mkdir
                || f === fsPromise.rmdir
                || f === fsPromise.rm
                || f === fsPromise.truncate
                || f === fsPromise.unlink)
            {
                const [path] = args as Parameters<typeof fsPromise.mkdir
                    | typeof fsPromise.rmdir
                    | typeof fsPromise.rm
                    | typeof fsPromise.truncate
                    | typeof fsPromise.unlink>;
                FileLogStoreAdaptor.appendFileOperation(path, 'write', this.getSandbox(), iid);
            }
            else if (f === fsPromise.mkdtemp)
            {
                (result as ReturnType<typeof fsPromise.mkdtemp>).then(
                    path => FileLogStoreAdaptor.appendFileOperation(path, 'write', this.getSandbox(), iid));
            }
            else if (f === fsPromise.open)
            {
                const [path] = args as Parameters<typeof fsPromise.open>;
                (result as ReturnType<typeof fsPromise.open>).then(fileHandle =>
                {
                    FileLogStore.addFileHandle(fileHandle, path);
                });
            }
            else if (f === fsPromise.readdir
                || f === fsPromise.readFile)
            {
                const [path] = args as Parameters<typeof fsPromise.readdir
                    | typeof fsPromise.readFile>;
                FileLogStoreAdaptor.appendFileOperation(path, 'read', this.getSandbox(), iid);
            }
            else if (f === fsPromise.writeFile)
            {
                const [file, data] = args as Parameters<typeof fsPromise.writeFile>;
                FileLogStoreAdaptor.appendFileOperation(file, 'write', this.getSandbox(), iid);
                if (isBufferLike(data))
                {
                    BufferLogStore.appendBufferOperation(data, 'read',
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                if (data instanceof Readable || data instanceof Writable)
                {
                    StreamLogStore.appendStreamOperation(data, 'read', this.getSandbox(), iid);
                }
                else if (isObject(data))
                {
                    ObjectLogStore.appendObjectOperation(data, 'read', this.getSandbox(), iid);
                }
            }
        };
    }
}