// DO NOT INSTRUMENT

import {strict as assert} from 'assert';
import crypto, {
    Certificate,
    Cipher,
    Decipher,
    DiffieHellman,
    ECDH,
    Hash,
    Hmac,
    KeyObject,
    Sign,
    Verify,
    X509Certificate,
} from 'crypto';
import {isFunction, isObject} from 'lodash';
import {Readable, Transform, Writable} from 'stream';
import {BufferLogStore} from '../../LogStore/BufferLogStore';
import {ObjectLogStore} from '../../LogStore/ObjectLogStore';
import {StreamLogStore} from '../../LogStore/StreamLogStore';
import {Analysis, Hooks, Sandbox} from '../../Type/nodeprof';
import {getSourceCodeInfoFromIid, isBufferLike, shouldBeVerbose} from '../../Util';

export class CryptoOperationLogger extends Analysis
{
    public invokeFun: Hooks['invokeFun'] | undefined;
    public functionEnter: Hooks['functionEnter'] | undefined;
    public endExecution: Hooks['endExecution'] | undefined;

    private timeConsumed: number;

    private readonly callbackToRegisterFunction: WeakMap<Function, Function>;

    constructor(sandbox: Sandbox)
    {
        super(sandbox);
        this.timeConsumed = 0;
        this.callbackToRegisterFunction = new WeakMap();
    }

    protected override registerHooks(): void
    {
        this.invokeFun = (iid, f, _base, args, result) =>
        {
            const startTimestamp = Date.now();

            if (f === Certificate.exportChallenge
                || f === Certificate.exportPublicKey
                || f === Certificate.prototype.exportChallenge
                || f === Certificate.prototype.exportPublicKey)
            {
                if (isBufferLike(args[0]))
                {
                    BufferLogStore.appendBufferOperation(args[0], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[0]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                assert.ok(isBufferLike(result));
                BufferLogStore.appendBufferOperation(result, 'write', 'finish',
                    BufferLogStore.getArrayBufferRangeOfArrayBufferView(result),
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (f === Certificate.verifySpkac
                || f === Certificate.prototype.verifySpkac
                // @ts-ignore
                || f === Cipher.prototype.setAAD
                // @ts-ignore
                || f === Decipher.prototype.setAAD
                // @ts-ignore
                || f === Decipher.prototype.setAuthTag
                || f === DiffieHellman.prototype.setPrivateKey
                || f === DiffieHellman.prototype.setPublicKey
                || f === ECDH.prototype.setPrivateKey
                || f === Hash.prototype.update
                || f === Hmac.prototype.update
                || f === Sign.prototype.update
                || f === Verify.prototype.update
                || f === X509Certificate
                || f === crypto.checkPrime
                || f === crypto.checkPrimeSync
                || f === crypto.createPrivateKey
                || f === crypto.createPublicKey
                || f === crypto.createSecretKey)
            {
                if (isBufferLike(args[0]))
                {
                    BufferLogStore.appendBufferOperation(args[0], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[0]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
            else if (f === Cipher.prototype.final
                || f === Decipher.prototype.final
                || f === Hash.prototype.digest
                || f === Hmac.prototype.digest
                || f === KeyObject.prototype.export
                || f === crypto.diffieHellman)
            {
                if (isBufferLike(result))
                {
                    BufferLogStore.appendBufferOperation(result, 'write', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(result),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
            // @ts-ignore
            else if (f === Cipher.prototype.getAuthTag)
            {
                assert.ok(isBufferLike(result));
                BufferLogStore.appendBufferOperation(result, 'write', 'finish',
                    BufferLogStore.getArrayBufferRangeOfArrayBufferView(result),
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (f === Cipher.prototype.update
                || f === Decipher.prototype.update
                || f === DiffieHellman.prototype.computeSecret
                || f === ECDH.convertKey
                || f === ECDH.prototype.computeSecret
                || f === crypto.randomFillSync)
            {
                if (isBufferLike(args[0]))
                {
                    BufferLogStore.appendBufferOperation(args[0], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[0]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                if (isBufferLike(result))
                {
                    BufferLogStore.appendBufferOperation(result, 'write', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(result),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
            else if (f === DiffieHellman.prototype.generateKeys
                || f === DiffieHellman.prototype.getGenerator
                || f === DiffieHellman.prototype.getPrime
                || f === DiffieHellman.prototype.getPrivateKey
                || f === DiffieHellman.prototype.getPublicKey
                || f === ECDH.prototype.generateKeys
                || f === ECDH.prototype.getPrivateKey
                || f === ECDH.prototype.getPublicKey
                || f === crypto.generatePrimeSync)
            {
                if (isBufferLike(result))
                {
                    BufferLogStore.appendBufferOperation(result, 'write', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(result),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
            else if (f === Sign.prototype.sign)
            {
                if (isBufferLike(args[0]))
                {
                    BufferLogStore.appendBufferOperation(args[0], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[0]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (isObject(args[0]))
                {
                    ObjectLogStore.appendObjectOperation(args[0], 'read', Object.keys(args[0]),
                        this.getSandbox(), iid);
                }
                if (isBufferLike(result))
                {
                    BufferLogStore.appendBufferOperation(result, 'write', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(result),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
            else if (f === Verify.prototype.verify)
            {
                if (isBufferLike(args[0]))
                {
                    BufferLogStore.appendBufferOperation(args[0], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[0]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                else if (isObject(args[0]))
                {
                    ObjectLogStore.appendObjectOperation(args[0], 'read', Object.keys(args[0]),
                        this.getSandbox(), iid);
                }
                if (isBufferLike(args[1]))
                {
                    BufferLogStore.appendBufferOperation(args[1], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[1]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
            else if (f === crypto.createCipher
                || f === crypto.createDecipher
                || f === crypto.createHmac)
            {
                if (isBufferLike(args[1]))
                {
                    BufferLogStore.appendBufferOperation(args[1], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[1]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                assert.ok(result instanceof Transform);
                StreamLogStore.appendStreamOperation(result, 'write', 'construction', this.getSandbox(), iid);
            }
            else if (f === crypto.createCipheriv
                || f === crypto.createDecipheriv)
            {
                if (isBufferLike(args[1]))
                {
                    BufferLogStore.appendBufferOperation(args[1], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[1]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                if (isBufferLike(args[2]))
                {
                    BufferLogStore.appendBufferOperation(args[2], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[2]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                assert.ok(result instanceof Transform);
                StreamLogStore.appendStreamOperation(result, 'write', 'construction', this.getSandbox(), iid);
            }
            else if (f === crypto.createDiffieHellman)
            {
                if (isBufferLike(args[0]))
                {
                    BufferLogStore.appendBufferOperation(args[0], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[0]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                if (isBufferLike(args[2]))
                {
                    BufferLogStore.appendBufferOperation(args[2], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[2]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
            else if (f === crypto.createHash
                || f === crypto.createSign
                || f === crypto.createVerify)
            {
                assert.ok(result instanceof Readable || result instanceof Writable);
                StreamLogStore.appendStreamOperation(result, 'write', 'construction', this.getSandbox(), iid);
            }
            else if (f === crypto.generateKeyPair
                || f === crypto.generatePrime)
            {
                const callback = args[args.length - 1];
                if (isFunction(callback))
                {
                    assert.ok(isFunction(callback));
                    this.callbackToRegisterFunction.set(callback, f);
                }
            }
            else if (f === crypto.generateKeyPairSync)
            {
                assert.ok(isObject(result));
                const {publicKey, privateKey} = result as ReturnType<typeof crypto.generateKeyPairSync>;
                if (isBufferLike(publicKey))
                {
                    BufferLogStore.appendBufferOperation(publicKey, 'write', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(publicKey),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                if (isBufferLike(privateKey))
                {
                    BufferLogStore.appendBufferOperation(privateKey, 'write', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(privateKey),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
            else if (f === crypto.hkdf)
            {
                if (isBufferLike(args[1]))
                {
                    BufferLogStore.appendBufferOperation(args[1], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[1]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                if (isBufferLike(args[2]))
                {
                    BufferLogStore.appendBufferOperation(args[2], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[2]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                if (isBufferLike(args[3]))
                {
                    BufferLogStore.appendBufferOperation(args[3], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[3]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                const callback = args[args.length - 1];
                assert.ok(isFunction(callback));
                this.callbackToRegisterFunction.set(callback, f);
            }
            else if (f === crypto.hkdfSync)
            {
                if (isBufferLike(args[1]))
                {
                    BufferLogStore.appendBufferOperation(args[1], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[1]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                if (isBufferLike(args[2]))
                {
                    BufferLogStore.appendBufferOperation(args[2], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[2]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                if (isBufferLike(args[3]))
                {
                    BufferLogStore.appendBufferOperation(args[3], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[3]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                assert.ok(isBufferLike(result));
                BufferLogStore.appendBufferOperation(result, 'write', 'finish',
                    BufferLogStore.getArrayBufferRangeOfArrayBufferView(result),
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (f === crypto.pbkdf2
                || f === crypto.scrypt)
            {
                if (isBufferLike(args[0]))
                {
                    BufferLogStore.appendBufferOperation(args[0], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[0]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                if (isBufferLike(args[1]))
                {
                    BufferLogStore.appendBufferOperation(args[1], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[1]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                const callback = args[args.length - 1];
                assert.ok(isFunction(callback));
                this.callbackToRegisterFunction.set(callback, f);
            }
            else if (f === crypto.pbkdf2Sync
                || f === crypto.privateDecrypt
                || f === crypto.privateEncrypt
                || f === crypto.publicDecrypt
                || f === crypto.publicEncrypt
                || f === crypto.scrypt)
            {
                if (isBufferLike(args[0]))
                {
                    BufferLogStore.appendBufferOperation(args[0], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[0]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                if (isBufferLike(args[1]))
                {
                    BufferLogStore.appendBufferOperation(args[1], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[1]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                assert.ok(isBufferLike(result));
                BufferLogStore.appendBufferOperation(result, 'write', 'finish',
                    BufferLogStore.getArrayBufferRangeOfArrayBufferView(result),
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (f === crypto.randomBytes)
            {
                const callback = args[args.length - 1];
                if (isFunction(callback))
                {
                    assert.ok(isFunction(callback));
                    this.callbackToRegisterFunction.set(callback, f);
                }
                else
                {
                    assert.ok(isBufferLike(result));
                    BufferLogStore.appendBufferOperation(result, 'write', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(result),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
            else if (f === crypto.randomFill)
            {
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, this.getSandbox());
                const [buffer] = args as Parameters<typeof crypto.randomFillSync>;
                BufferLogStore.appendBufferOperation(buffer, 'write', 'finish',
                    BufferLogStore.getArrayBufferRangeOfArrayBufferView(buffer),
                    sourceCodeInfo);
            }
            else if (f === crypto.sign)
            {
                if (isBufferLike(args[1]))
                {
                    BufferLogStore.appendBufferOperation(args[1], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[1]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                if (isBufferLike(args[2]))
                {
                    BufferLogStore.appendBufferOperation(args[2], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[2]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                const callback = args[args.length - 1];
                if (isFunction(callback))
                {
                    assert.ok(isFunction(callback));
                    this.callbackToRegisterFunction.set(callback, f);
                }
                else
                {
                    assert.ok(isBufferLike(result));
                    BufferLogStore.appendBufferOperation(result, 'write', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(result),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }
            else if (f === crypto.timingSafeEqual)
            {
                assert.ok(isBufferLike(args[0]));
                BufferLogStore.appendBufferOperation(args[0], 'read', 'finish',
                    BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[0]),
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
                assert.ok(isBufferLike(args[1]));
                BufferLogStore.appendBufferOperation(args[1], 'read', 'finish',
                    BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[1]),
                    getSourceCodeInfoFromIid(iid, this.getSandbox()));
            }
            else if (f === crypto.verify)
            {
                if (isBufferLike(args[1]))
                {
                    BufferLogStore.appendBufferOperation(args[1], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[1]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                if (isBufferLike(args[2]))
                {
                    BufferLogStore.appendBufferOperation(args[2], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[2]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
                if (isBufferLike(args[3]))
                {
                    BufferLogStore.appendBufferOperation(args[3], 'read', 'finish',
                        BufferLogStore.getArrayBufferRangeOfArrayBufferView(args[3]),
                        getSourceCodeInfoFromIid(iid, this.getSandbox()));
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.functionEnter = (iid, f, _dis, args) =>
        {
            const startTimestamp = Date.now();

            const registerFunction = this.callbackToRegisterFunction.get(f);
            if (registerFunction !== undefined)
            {
                const sourceCodeInfo = getSourceCodeInfoFromIid(iid, this.getSandbox());
                if (registerFunction === crypto.generatePrime
                    || registerFunction === crypto.hkdf
                    || registerFunction === crypto.pbkdf2
                    || registerFunction === crypto.randomBytes
                    || registerFunction === crypto.scrypt
                    || registerFunction === crypto.sign)
                {
                    const [err, arg] = args;
                    if (!err)
                    {
                        if (isBufferLike(arg))
                        {
                            BufferLogStore.appendBufferOperation(arg, 'write', 'finish',
                                BufferLogStore.getArrayBufferRangeOfArrayBufferView(arg),
                                sourceCodeInfo);
                        }
                    }
                }
                else if (f === crypto.generateKeyPair)
                {
                    const [err, publicKey, privateKey] = args;
                    if (!err)
                    {
                        if (isBufferLike(publicKey))
                        {
                            BufferLogStore.appendBufferOperation(publicKey, 'write', 'finish',
                                BufferLogStore.getArrayBufferRangeOfArrayBufferView(publicKey),
                                sourceCodeInfo);
                        }
                        if (isBufferLike(privateKey))
                        {
                            BufferLogStore.appendBufferOperation(privateKey, 'write', 'finish',
                                BufferLogStore.getArrayBufferRangeOfArrayBufferView(privateKey),
                                sourceCodeInfo);
                        }
                    }
                }
            }

            this.timeConsumed += Date.now() - startTimestamp;
        };

        this.endExecution = () =>
        {
            if (shouldBeVerbose())
            {
                console.log(`Crypto: ${this.timeConsumed / 1000}s`);
            }
        };
    }
}