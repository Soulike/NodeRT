// DO NOT INSTRUMENT

import {ArrayDeclaration} from './Class/ArrayDeclaration';
import {AsyncContextLogStore} from '../AsyncContextLogStore';
import {ArrayOperation} from './Class/ArrayOperation';
import {getSourceCodeInfoFromIid} from '../../Util';
import {Sandbox} from '../../Type/nodeprof';

// Since array is used in many modules, we need to log its declarations in a shared object
export class ArrayLogStore
{
    private static arrayToArrayDeclaration: Map<ReadonlyArray<unknown>, ArrayDeclaration> = new Map();

    public static getArrayDeclarations(): ReadonlyArray<ArrayDeclaration>
    {
        return Array.from(this.arrayToArrayDeclaration.values());
    }

    public static appendArrayOperation(array: ReadonlyArray<unknown>, type: 'read' | 'write', sandbox: Sandbox, iid: number)
    {
        const arrayDeclaration = ArrayLogStore.getArrayDeclaration(array);
        arrayDeclaration.appendOperation(AsyncContextLogStore.getCurrentCallbackFunction(),
            new ArrayOperation(type, getSourceCodeInfoFromIid(iid, sandbox)));
    }

    private static getArrayDeclaration(array: ReadonlyArray<unknown>)
    {
        const arrayDeclaration = ArrayLogStore.arrayToArrayDeclaration.get(array);
        if (arrayDeclaration === undefined)
        {
            const newArrayDeclaration = new ArrayDeclaration(array);
            this.arrayToArrayDeclaration.set(array, newArrayDeclaration);
            return newArrayDeclaration;
        }
        else
        {
            return arrayDeclaration;
        }
    }
}