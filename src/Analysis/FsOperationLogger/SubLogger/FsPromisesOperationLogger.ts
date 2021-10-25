// DO NOT INSTRUMENT

import fsPromise from 'fs/promises';
import {isObject} from 'lodash';
import {Readable, Writable} from 'stream';
import {BufferLogStore} from '../../../LogStore/BufferLogStore';
import {FileLogStore} from '../../../LogStore/FileLogStore';
import {ObjectLogStore} from '../../../LogStore/ObjectLogStore';
import {StreamLogStore} from '../../../LogStore/StreamLogStore';
import {Analysis, Hooks, Sandbox} from '../../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike, shouldBeVerbose} from '../../../Util';
import {FileLogStoreAdaptor} from '../FileLogStoreAdaptor';

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
                const [src, dst] = args as Parameters<typeof fsPromise.copyFile
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
                || f === fsPromise.readFile
                || f === fsPromise.access)
            {
                const [path] = args as Parameters<typeof fsPromise.readdir
                    | typeof fsPromise.readFile
                    | typeof fsPromise.access>;
                FileLogStoreAdaptor.appendFileOperation(path, 'read', this.getSandbox(), iid);
            }
            else if (f === fsPromise.chmod
                || f === fsPromise.chown)
            {
                const [path] = args as Parameters<typeof fsPromise.chmod>;
                FileLogStoreAdaptor.appendFileOperation(path, 'write', this.getSandbox(), iid);
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
                    ObjectLogStore.appendObjectOperation(data, 'read', null, this.getSandbox(), iid);
                }
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