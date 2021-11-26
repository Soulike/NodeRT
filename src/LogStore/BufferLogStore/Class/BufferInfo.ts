import assert from 'assert';
import util from 'util';
import {ArrayBufferLike} from '../../../Analysis/Type/ArrayBufferLike';
import {BufferLike} from '../../../Analysis/Type/BufferLike';
import {ResourceInfo} from '../../Class/ResourceInfo';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {StatisticsStore} from '../../StatisticsStore';

export class BufferInfo extends ResourceInfo
{
    private readonly bufferWeakRef: WeakRef<ArrayBufferLike>;

    constructor(buffer: ArrayBufferLike, possibleDefineCodeScope: SourceCodeInfo | null)
    {
        super('buffer', possibleDefineCodeScope);
        assert.ok(util.types.isAnyArrayBuffer(buffer));
        this.bufferWeakRef = new WeakRef(buffer);
        StatisticsStore.addBufferCount();
    }

    public override getHash(): object
    {
        return this;
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