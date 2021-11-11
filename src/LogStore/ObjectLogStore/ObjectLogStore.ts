// DO NOT INSTRUMENT

import {Sandbox} from '../../Type/nodeprof';
import {AsyncContextLogStore} from '../AsyncContextLogStore';
import {getSourceCodeInfoFromIid} from '../../Util';
import {ObjectDeclaration} from './Class/ObjectDeclaration';
import {ObjectOperation} from './Class/ObjectOperation';
import asyncHooks from 'async_hooks';
import {CallStackLogStore} from '../CallStackLogStore';
import {SourceCodeInfo} from '../Class/SourceCodeInfo';

export class ObjectLogStore
{
    private static objectToObjectDeclaration: WeakMap<object, ObjectDeclaration> = new WeakMap();
    private static objectDeclarations: ObjectDeclaration[] = [];

    public static getObjectDeclarations(): ReadonlyArray<ObjectDeclaration>
    {
        return ObjectLogStore.objectDeclarations;
    }

    public static appendObjectOperation(object: object, type: 'read' | 'write', fields: Iterable<unknown>, sandbox: Sandbox, iid: number)
    {
        const objectDeclaration = ObjectLogStore.getObjectDeclaration(object, getSourceCodeInfoFromIid(iid, sandbox));
        const asyncContext = AsyncContextLogStore.getAsyncContextFromAsyncId(asyncHooks.executionAsyncId());
        if (type === 'write')
        {
            asyncContext.setHasWriteOperation(objectDeclaration);
        }
        objectDeclaration.appendOperation(asyncContext,
            new ObjectOperation(type, new Set(fields), CallStackLogStore.getCallStack(), getSourceCodeInfoFromIid(iid, sandbox)));
    }

    private static getObjectDeclaration(object: object, sourceCodeInfo: SourceCodeInfo)
    {
        const objectDeclaration = ObjectLogStore.objectToObjectDeclaration.get(object);
        if (objectDeclaration === undefined)
        {
            const newObjectDeclaration = new ObjectDeclaration(object, sourceCodeInfo);
            ObjectLogStore.objectDeclarations.push(newObjectDeclaration);
            ObjectLogStore.objectToObjectDeclaration.set(object, newObjectDeclaration);
            return newObjectDeclaration;
        }
        else
        {
            return objectDeclaration;
        }
    }
}