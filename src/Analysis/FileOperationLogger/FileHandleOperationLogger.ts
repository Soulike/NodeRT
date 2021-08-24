// DO NOT INSTRUMENT

import {FileLogStore} from '../../LogStore/FileLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {FileHandle} from 'fs/promises';
import {getSourceCodeInfoFromIid, isBufferLike} from '../../Util';
import {FileOperationLogger} from './FileOperationLogger';
import {isObject} from 'lodash';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {BufferLogStore} from '../../LogStore/BufferLogStore';

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
                    FileOperationLogger.appendOperation(fileHandle, 'write', this.getSandbox(), iid);
                }
                else if (f === fileHandle.read)
                {
                    FileOperationLogger.appendOperation(fileHandle, 'read', this.getSandbox(), iid);
                    (result as ReturnType<typeof fileHandle.read>).then(({buffer}) =>
                    {
                        BufferLogStore.appendBufferOperation(buffer.buffer, 'write',
                            getSourceCodeInfoFromIid(iid, this.getSandbox()));
                    });
                }
                else if (f === fileHandle.readFile)
                {
                    FileOperationLogger.appendOperation(fileHandle, 'read', this.getSandbox(), iid);
                }
                else if (f === fileHandle.readv)
                {
                    FileOperationLogger.appendOperation(fileHandle, 'read', this.getSandbox(), iid);
                    (result as ReturnType<typeof fileHandle.readv>).then(({buffers}) =>
                    {
                        for (const buffer of buffers)
                        {
                            BufferLogStore.appendBufferOperation(buffer.buffer, 'write',
                                getSourceCodeInfoFromIid(iid, this.getSandbox()));
                        }
                    });
                }
                else if (f === fileHandle.truncate)
                {
                    FileOperationLogger.appendOperation(fileHandle, 'write', this.getSandbox(), iid);
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
                        ObjectLogStore.appendObjectOperation(args[0], 'read', this.getSandbox(), iid);
                    }
                    FileOperationLogger.appendOperation(fileHandle, 'write', this.getSandbox(), iid);
                }
                else if (f === fileHandle.writev)
                {
                    FileOperationLogger.appendOperation(fileHandle, 'write', this.getSandbox(), iid);
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