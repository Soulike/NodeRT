// DO NOT INSTRUMENT

import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {Certificate, Cipher, Decipher, DiffieHellman, ECDH, Hash, Hmac, KeyObject, Verify} from 'crypto';
import crypto from 'crypto';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {getSourceCodeInfoFromIid, isBufferLike} from '../../Util';
import {isFunction, isObject} from 'lodash';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {strict as assert} from 'assert';

export class CryptoOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public functionEnter: Hooks['functionEnter'] | undefined;

    private readonly callbackToRegisterFunction: WeakMap<Function, Function>;

    // Capitalization for static methods
    private static readonly CryptoFunctions = new Set(Object.values(crypto));
    private static readonly CertificateFunctions = new Set(Object.values(Certificate));
    private static readonly certificateFunctions = new Set(Object.values(Certificate.prototype));
    private static readonly cipherFunctions = new Set(Object.values(Cipher.prototype));
    private static readonly decipherFunctions = new Set(Object.values(Decipher.prototype));
    private static readonly diffieHellmanFunctions = new Set(Object.values(DiffieHellman.prototype));
    private static readonly ECDHFunctions = new Set(Object.values(ECDH));
    private static readonly ecdhFunctions = new Set(Object.values(ECDH.prototype));
    private static readonly hashFunctions = new Set(Object.values(Hash.prototype));
    private static readonly hmacFunctions = new Set(Object.values(Hmac.prototype));
    private static readonly KeyObjectFunctions = new Set(Object.values(KeyObject));
    private static readonly keyObjectFunctions = new Set(Object.values(KeyObject.prototype));
    // It's a @types/node error
    // @ts-ignore
    private static readonly signFunctions = new Set(Object.values(crypto.Sign.prototype));
    private static readonly verifyFunctions = new Set(Object.values(Verify.prototype));
    // TODO: X509Certificate

    constructor(sandbox: Sandbox)
    {
        super(sandbox);

        this.callbackToRegisterFunction = new WeakMap();

        this.registerHooks();
    }

    protected override registerHooks(): void
    {
        this.invokeFun = (iid, f, _base, args, result) =>
        {
            if (f === crypto.randomBytes
                || f === crypto.sign)
            {
                const callback = args[args.length - 1];
                if (callback !== undefined)
                {
                    assert.ok(isFunction(callback));
                    this.callbackToRegisterFunction.set(callback, f);
                }
            }

            if (f === crypto.randomFillSync
                || f === crypto.randomFill)
            {
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, this.getSandbox());
                const [buffer] = args as Parameters<typeof crypto.randomFillSync>;
                BufferLogStore.appendBufferOperation(buffer, 'write', sourceCodeInfo);
            }
            // @ts-ignore
            else if (CryptoOperationLogger.CryptoFunctions.has(f)
                || CryptoOperationLogger.CertificateFunctions.has(f)
                || CryptoOperationLogger.certificateFunctions.has(f)
                || CryptoOperationLogger.cipherFunctions.has(f)
                || CryptoOperationLogger.decipherFunctions.has(f)
                || CryptoOperationLogger.diffieHellmanFunctions.has(f)
                || CryptoOperationLogger.ECDHFunctions.has(f)
                || CryptoOperationLogger.ecdhFunctions.has(f)
                || CryptoOperationLogger.hashFunctions.has(f)
                || CryptoOperationLogger.hmacFunctions.has(f)
                || CryptoOperationLogger.KeyObjectFunctions.has(f)
                || CryptoOperationLogger.keyObjectFunctions.has(f)
                || CryptoOperationLogger.signFunctions.has(f)
                || CryptoOperationLogger.verifyFunctions.has(f))
            {
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, this.getSandbox());
                for (const arg of args)
                {
                    if (isBufferLike(arg))
                    {
                        BufferLogStore.appendBufferOperation(arg, 'read', sourceCodeInfo);
                    }
                    else if (isObject(arg))
                    {
                        ObjectLogStore.appendObjectOperation(arg, 'read', this.getSandbox(), iid);
                    }
                }
                if (isBufferLike(result))
                {
                    BufferLogStore.appendBufferOperation(result, 'write', sourceCodeInfo);
                    ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
                }
                else if (isObject(result))
                {
                    ObjectLogStore.appendObjectOperation(result, 'write', this.getSandbox(), iid);
                }
            }
        };

        this.functionEnter = (iid, f, _dis, args) =>
        {
            const registerFunction = this.callbackToRegisterFunction.get(f);
            if (registerFunction !== undefined)
            {
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, this.getSandbox());
                if (registerFunction === crypto.randomBytes
                    || registerFunction === crypto.sign)
                {
                    const [err, buf] = args as Parameters<Parameters<typeof crypto.randomBytes>[1]>;
                    if (!err)
                    {
                        assert.ok(isBufferLike(buf));
                        BufferLogStore.appendBufferOperation(buf, 'write', sourceCodeInfo);
                    }
                }
            }
        };
    }
}