// DO NOT INSTRUMENT

import ArrayBufferView = NodeJS.ArrayBufferView;

type BufferLike = Buffer | ArrayBufferView | ArrayBuffer | SharedArrayBuffer;

export default BufferLike;