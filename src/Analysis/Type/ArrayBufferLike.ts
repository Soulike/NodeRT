// DO NOT INSTRUMENT

// Data structure under BufferLike
// If changed, remember to modify isArrayBufferLike() in Util.ts
type ArrayBufferLike = ArrayBuffer | SharedArrayBuffer;

export default ArrayBufferLike;