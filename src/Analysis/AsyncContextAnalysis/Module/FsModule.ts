// DO NOT INSTRUMENT

import CallbackFunction from '../../Class/CallbackFunction';
import SourceCodeInfo from '../../Class/SourceCodeInfo';
import CallbackFunctionContext from '../../Singleton/CallbackFunctionContext';
import FsCallbackFunctionType from '../../Type/FsCallbackFunctionType';
import fs from 'fs';

class EventsModule
{
    public static runHooks(f: Function, args: unknown[], currentCallbackFunction: CallbackFunction, sourceCodeInfo: SourceCodeInfo)
    {
        if (args.length > 0)
        {
            let type: null | FsCallbackFunctionType = null;

            if (f === fs.access || f === fs.appendFile
                || f === fs.chmod || f === fs.chown || f === fs.close
                || f === fs.copyFile || f === fs.exists
                || f === fs.fchmod || f === fs.fchown
                || f === fs.fdatasync || f === fs.fstat || f === fs.fsync || f === fs.ftruncate || f === fs.futimes
                || f === fs.lchmod || f === fs.lchown || f === fs.lutimes || f === fs.link || f === fs.lstat
                || f === fs.mkdir || f === fs.mkdtemp || f === fs.open || f === fs.opendir
                || f === fs.read || f === fs.readdir || f === fs.readFile
                || f === fs.readlink || f === fs.readv || f === fs.realpath || f === fs.realpath.native || f === fs.rename
                || f === fs.rmdir || f === fs.rm || f === fs.stat || f === fs.symlink || f === fs.truncate || f === fs.unlink || f === fs.utimes
                || f === fs.write || f === fs.writeFile || f === fs.writev
                || f === fs.Dir.prototype.close || f === fs.Dir.prototype.read)
            {
                type = 'fsAccess';
            }
            else if (f === fs.watch || f === fs.watchFile)
            {
                type = 'fsWatch';
            }
            else if (f === fs.WriteStream.prototype.close)
            {
                type = 'fsWriteStreamClose';
            }

            if (type !== null)
            {
                const callback = args[args.length - 1];
                if (typeof callback === 'function' || callback instanceof Function)
                {
                    CallbackFunctionContext.pushToPendingCallbackFunctions(new CallbackFunction(callback, type, currentCallbackFunction, null, null, sourceCodeInfo));
                }
            }
        }
    }
}

export default EventsModule;