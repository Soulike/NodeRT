// DO NOT INSTRUMENT

import ArrayBufferView = NodeJS.ArrayBufferView;
import ArrayBufferLike from './ArrayBufferLike';

type BufferLike = Buffer | ArrayBufferView | ArrayBufferLike;

export default BufferLike;