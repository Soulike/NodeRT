// DO NOT INSTRUMENT

import {ResourceDeclaration} from '../../Class/ResourceDeclaration';
import {AsyncCalledFunctionInfo} from '../../Class/AsyncCalledFunctionInfo';
import {ObjectOperation} from './ObjectOperation';
import assert from 'assert';
import {isObject} from 'lodash';
import {RaceDetector} from '../../../RaceDetector';
import {ObjectInfo} from './ObjectInfo';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';

export class ObjectDeclaration extends ResourceDeclaration
{
    private readonly objectInfo: ObjectInfo;
    private readonly asyncContextToOperations: Map<AsyncCalledFunctionInfo, ObjectOperation[]>;

    constructor(object: object, possibleDefineCodeScope: SourceCodeInfo)
    {
        super();
        assert.ok(isObject(object));
        this.objectInfo = new ObjectInfo(object, possibleDefineCodeScope);
        this.asyncContextToOperations = new Map();
    }

    public getResourceInfo(): ObjectInfo
    {
        return this.objectInfo;
    }

    public appendOperation(currentCallbackFunction: AsyncCalledFunctionInfo, objectOperation: ObjectOperation): void
    {
        const operations = this.asyncContextToOperations.get(currentCallbackFunction);
        if (operations === undefined)
        {
            this.asyncContextToOperations.set(currentCallbackFunction, [objectOperation]);
        }
        else
        {
            operations.push(objectOperation);
        }
        RaceDetector.emit('operationAppended', this);
    }

    public getAsyncContextToOperations(): ReadonlyMap<AsyncCalledFunctionInfo, ObjectOperation[]>
    {
        return this.asyncContextToOperations;
    }

    public is(other: unknown): boolean
    {
        return this.objectInfo.is(other);
    }
}