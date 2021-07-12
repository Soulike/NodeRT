// DO NOT INSTRUMENT

import ArrayBufferView = NodeJS.ArrayBufferView;
import {ArrayBufferLike} from './ArrayBufferLike';

// If changed, remember to modify isBufferLike() in Util.ts
export type BufferLike = Buffer | ArrayBufferView | ArrayBufferLike;