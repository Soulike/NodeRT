// DO NOT INSTRUMENT

import {FileLogStore} from '../../../LogStore/FileLogStore';
import {Analysis, Hooks, Sandbox} from '../../../Type/nodeprof';
import {FileHandle} from 'fs/promises';
import {getSourceCodeInfoFromIid, isBufferLike} from '../../../Util';
import {FileLogStoreAdaptor} from '../FileLogStoreAdaptor';
import {isObject} from 'lodash';
import {ObjectLogStore} from '../../../LogStore/ObjectLogStore';
import {BufferLogStore} from '../../../LogStore/BufferLogStore';

export class FileHandleOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public functionEnter: Hooks['functionEnter'] | undefined;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.registerHooks();
    }

    protected override registerHooks()
    {
        this.invokeFun = (iid, f, base, args, result) =>
        {
            if (FileLogStore.hasFileHandle(base as any))
            {
                const fileHandle = base as FileHandle;

                if (f === fileHandle.appendFile)
                {
                    if (isBufferLike(args[0]))
                    {
                        BufferLogStore.appendBufferOperation(args[0], 'read',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                    FileLogStoreAdaptor.appendFileOperation(fileHandle, 'write', this.getSandbox(), iid);
                }
                else if (f === fileHandle.close)
                {
                    (result as ReturnType<typeof fileHandle.close>).then(
                        () => FileLogStore.deleteFileHandle(fileHandle));
                }
                else if (f === fileHandle.read)
                {
                    FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', this.getSandbox(), iid);
                    (result as ReturnType<typeof fileHandle.read>).then(({buffer}) =>
                    {
                        BufferLogStore.appendBufferOperation(buffer.buffer, 'write',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    });
                }
                else if (f === fileHandle.readFile
                    || f === fileHandle.stat)
                {
                    FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', this.getSandbox(), iid);
                }
                else if (f === fileHandle.readv)
                {
                    FileLogStoreAdaptor.appendFileOperation(fileHandle, 'read', this.getSandbox(), iid);
                    (result as ReturnType<typeof fileHandle.readv>).then(({buffers}) =>
                    {
                        for (const buffer of buffers)
                        {
                            BufferLogStore.appendBufferOperation(buffer.buffer, 'write',
                                getSourceCodeInfoFromIid(iid, this.getSandbox()));
                        }
                    });
                }
                else if (f === fileHandle.truncate
                    || f === fileHandle.chmod
                    || f === fileHandle.chown)
                {
                    FileLogStoreAdaptor.appendFileOperation(fileHandle, 'write', this.getSandbox(), iid);
                }
                else if (f === fileHandle.write
                    || f === fileHandle.writeFile)
                {
                    if (isBufferLike(args[0]))
                    {
                        BufferLogStore.appendBufferOperation(args[0], 'read',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    }
                    else if (isObject(args[0]))
                    {
                        ObjectLogStore.appendObjectOperation(args[0], 'read',null, this.getSandbox(), iid);
                    }
                    FileLogStoreAdaptor.appendFileOperation(fileHandle, 'write', this.getSandbox(), iid);
                }
                else if (f === fileHandle.writev)
                {
                    FileLogStoreAdaptor.appendFileOperation(fileHandle, 'write', this.getSandbox(), iid);
                    (result as ReturnType<typeof fileHandle.writev>).then(({buffers}) =>
                    {
                        for (const buffer of buffers)
                        {
                            BufferLogStore.appendBufferOperation(buffer.buffer, 'read',
                                getSourceCodeInfoFromIid(iid, this.getSandbox()));
                        }
                    });
                }
            }
        };
    }
}