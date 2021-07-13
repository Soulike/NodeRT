// DO NOT INSTRUMENT

import {ArrayOperation} from '../ArrayLogStore';
import {Sandbox} from '../../Type/nodeprof';
import {AsyncContextLogStore} from '../AsyncContextLogStore';
import {getSourceCodeInfoFromIid} from '../../Util';
import {ObjectDeclaration} from './Class/ObjectDeclaration';

export class ObjectLogStore
{
    private static objectToObjectDeclaration: Map<object, ObjectDeclaration> = new Map();

    public static getObjectDeclarations(): ReadonlyArray<ObjectDeclaration>
    {
        return Array.from(ObjectLogStore.objectToObjectDeclaration.values());
    }

    public static appendObjectOperation(object: object, type: 'read' | 'write', sandbox: Sandbox, iid: number)
    {
        const objectDeclaration = ObjectLogStore.getObjectDeclaration(object);
        objectDeclaration.appendOperation(AsyncContextLogStore.getCurrentCallbackFunction(),
            new ArrayOperation(type, getSourceCodeInfoFromIid(iid, sandbox)));
    }

    private static getObjectDeclaration(object: object)
    {
        const objectDeclaration = ObjectLogStore.objectToObjectDeclaration.get(object);
        if (objectDeclaration === undefined)
        {
            const newObjectDeclaration = new ObjectDeclaration(object);
            this.objectToObjectDeclaration.set(object, newObjectDeclaration);
            return newObjectDeclaration;
        }
        else
        {
            return objectDeclaration;
        }
    }
}