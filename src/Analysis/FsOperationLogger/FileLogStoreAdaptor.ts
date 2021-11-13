// DO NOT INSTRUMENT

import {Sandbox} from '../../Type/nodeprof';
import {FileLogStore, FileOperation, FileOperationOnType} from '../../LogStore/FileLogStore';
import {FileHandle} from 'fs/promises';
import {PathLike} from 'fs';
import {isBufferLike, isURL} from '../../Util';
import {BufferLike} from '../Type/BufferLike';
import {BufferLogStore} from '../../LogStore/BufferLogStore';

export class FileLogStoreAdaptor
{
    /**
     * Determine whether the operation is appended to BufferLogStore or FileLogStore
     * */
    public static appendFileOperation(fileHandle: FileHandle, type: 'read' | 'write', accessStage: FileOperation['accessStage'], operationOn: FileOperationOnType, sandbox: Sandbox, iid: number): void;
    public static appendFileOperation(filePathLike: PathLike | BufferLike, type: 'read' | 'write', accessStage: FileOperation['accessStage'], operationOn: FileOperationOnType, sandbox: Sandbox, iid: number): void;
    public static appendFileOperation(fd: number, type: 'read' | 'write', accessStage: FileOperation['accessStage'], operationOn: FileOperationOnType, sandbox: Sandbox, iid: number): void;
    public static appendFileOperation(filePathLikeOrFdOrFileHandle: PathLike | number | BufferLike | FileHandle, type: 'read' | 'write', accessStage: FileOperation['accessStage'], operationOn: FileOperationOnType, sandbox: Sandbox, iid: number): void;
    public static appendFileOperation(filePathLikeOrFdOrFileHandle: PathLike | number | BufferLike | FileHandle, type: 'read' | 'write', accessStage: FileOperation['accessStage'], operationOn: FileOperationOnType, sandbox: Sandbox, iid: number)
    {
        if (isBufferLike(filePathLikeOrFdOrFileHandle))
        {
            const buffer = filePathLikeOrFdOrFileHandle;
            BufferLogStore.appendBufferOperation(buffer, type, accessStage,
                BufferLogStore.getArrayBufferRangeOfArrayBufferView(buffer), sandbox, iid);
        }
        else if (typeof filePathLikeOrFdOrFileHandle === 'number')   // fd
        {
            const fd = filePathLikeOrFdOrFileHandle;
            const filePathOrBuffer = FileLogStore.getFilePathOrBufferFromFd(fd);
            if (isBufferLike(filePathOrBuffer))
            {
                const buffer = filePathOrBuffer;
                BufferLogStore.appendBufferOperation(buffer, type, accessStage,
                    BufferLogStore.getArrayBufferRangeOfArrayBufferView(buffer), sandbox, iid);
            }
            else if (typeof filePathOrBuffer === 'string')
            {
                const filePath = filePathOrBuffer;
                FileLogStore.appendFileOperation(filePath, type, accessStage, operationOn, sandbox, iid);
            }
            else
            {
                // ignore undefined one
            }
        }
        else if (isURL(filePathLikeOrFdOrFileHandle) || typeof filePathLikeOrFdOrFileHandle === 'string')
        {
            const filePathOrUrl = filePathLikeOrFdOrFileHandle;
            FileLogStore.appendFileOperation(filePathOrUrl, type, accessStage, operationOn, sandbox, iid);
        }
        else    // FileHandle
        {
            const fileHandle = filePathLikeOrFdOrFileHandle;
            FileLogStoreAdaptor.appendFileOperation(fileHandle.fd, type, accessStage, operationOn, sandbox, iid);
        }
    }
}