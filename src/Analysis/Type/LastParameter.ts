// DO NOT INSTRUMENT

type LastParameter<T extends (...args: any) => any> = T extends (...args: [...infer I, infer M]) => any ? M : never;

export default LastParameter;