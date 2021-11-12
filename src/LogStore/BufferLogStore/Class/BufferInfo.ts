import {ResourceInfo} from '../../Class/ResourceInfo';
import {ArrayBufferLike} from '../../../Analysis/Type/ArrayBufferLike';
import {StatisticsStore} from '../../StatisticsStore';
import {BufferLike} from '../../../Analysis/Type/BufferLike';
import util from 'util';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import assert from 'assert';

export class BufferInfo extends ResourceInfo
{
    private readonly bufferWeakRef: WeakRef<ArrayBufferLike>;

    constructor(buffer: ArrayBufferLike, possibleDefineCodeScope: SourceCodeInfo)
    {
        super('buffer', possibleDefineCodeScope);
        assert.ok(util.types.isAnyArrayBuffer(buffer));
        this.bufferWeakRef = new WeakRef(buffer);
        StatisticsStore.addBufferCount();
    }

    public is(otherBuffer: BufferLike): boolean
    {
        if (util.types.isAnyArrayBuffer(otherBuffer))
        {
            return this.bufferWeakRef.deref() === otherBuffer;
        }
        else
        {
            return this.bufferWeakRef.deref() === otherBuffer.buffer;
        }
    }

    public toJSON()
    {
        return {...this, bufferWeakRef: undefined};
    }
}