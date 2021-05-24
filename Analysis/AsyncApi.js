const Callback = require('./AsyncApi/Class/Callback');
const VariableDeclare = require('./AsyncApi/Class/VariableDeclare');
const VariableOperation = require('./AsyncApi/Class/VariableOperation');
const CallbackRegister = require('./AsyncApi/Class/CallbackRegister');
const Range = require('./AsyncApi/Class/Range');
const EventEmitter = require('events');

// DO NOT INSTRUMENT
(function (sandbox)
{
    function AsyncApi()
    {
        /**@type Callback*/
        let currentCallback = new Callback(null, 'global', null, null);

        /**@type Array<Callback>*/
        let callbacks = [];

        /**@type VariableDeclare[]*/
        const variableDeclares = [];

        process.on('exit', () =>
        {
            console.log(JSON.stringify(variableDeclares, function replacer(key, value)
            {
                if (value instanceof Map)
                {
                    return {
                        dataType: 'Map',
                        value: Array.from(value.entries()), // or with spread: value: [...value]
                    };
                }
                else if (typeof value === 'function')
                {
                    return `[Function ${value.name ? value.name : 'anonymous'}]`;
                }
                else
                {
                    return value;
                }
            }, 4));
        });

        /**
         *  Declaration of a symbol, type can be `'const', 'let', 'var'`, kind is `'FunctionDeclaration'` or `undefined`.
         *  Jalangi version: this.declare = function (iid, name, val, isArgument, argumentIndex, isCatchParam) {
         **/
        this.declarePre = function (iid, name, type, kind)
        {

        };

        this.declare = function (iid, name, type, kind)
        {
            if (type !== 'const')
            {
                variableDeclares.push(new VariableDeclare(name, currentCallback));
            }
        };

        /**
         * This callback is called after a variable is read.
         *
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {string} name - Name of the variable being read
         * @param {*} val - Value read from the variable
         * @param {boolean} isGlobal - True if the variable is not declared using <tt>var</tt> (e.g. <tt>console</tt>)
         * @param {boolean} isScriptLocal - True if the variable is declared in the global scope using <tt>var</tt>
         * @returns {{result: *} | undefined} - If an object is returned, the result of the read operation is
         * replaced with the value stored in the <tt>result</tt> property of the object.
         * */
        this.read = function (iid, name, val, isGlobal, isScriptLocal)
        {
            for (let i = variableDeclares.length - 1; i >= 0; i--)
            {
                const declare = variableDeclares[i];
                if (declare.name === name)
                {
                    const newOperation = new VariableOperation('read', val);
                    const operationsOfCurrentCallback = declare.operations.get(currentCallback);
                    if (operationsOfCurrentCallback === undefined)
                    {
                        declare.operations.set(currentCallback, [newOperation]);
                    }
                    else
                    {
                        operationsOfCurrentCallback.push(newOperation);
                    }
                    break;
                }
            }
        };

        /**
         * This callback is called before a variable is written.
         *
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {string} name - Name of the variable being read
         * @param {*} val - Value to be written to the variable
         * @param {*} lhs - Value stored in the variable before the write operation
         * @param {boolean} isGlobal - True if the variable is not declared using <tt>var</tt> (e.g. <tt>console</tt>)
         * @param {boolean} isScriptLocal - True if the variable is declared in the global scope using <tt>var</tt>
         * @returns {{result: *} | undefined} - If an object is returned, the result of the write operation is
         * replaced with the value stored in the <tt>result</tt> property of the object.
         * */
        this.write = function (iid, name, val, lhs, isGlobal, isScriptLocal)
        {
            for (let i = variableDeclares.length - 1; i >= 0; i--)
            {
                const declare = variableDeclares[i];
                if (declare.name === name)
                {
                    const newOperation = new VariableOperation('write', val);
                    const operationsOfCurrentCallback = declare.operations.get(currentCallback);
                    if (operationsOfCurrentCallback === undefined)
                    {
                        declare.operations.set(currentCallback, [newOperation]);
                    }
                    else
                    {
                        operationsOfCurrentCallback.push(newOperation);
                    }
                    break;
                }
            }
        };

        /**
         * This callback is called before the execution of a function body starts.
         *
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {function} f - The function object whose body is about to get executed
         * @param {*} dis - The value of the <tt>this</tt> variable in the function body
         * @param {Array} args - List of the arguments with which the function is called
         * @returns {undefined} - Any return value is ignored
         * */
        this.functionEnter = function (iid, f, dis, args)
        {
            const timerCallbacksCopy = Array.from(callbacks);
            for (let i = 0; i < timerCallbacksCopy.length; i++)
            {
                const callback = timerCallbacksCopy[i];
                if (callback.func === f)
                {
                    currentCallback = callback;
                    callbacks = [...callbacks.slice(0, i), ...callbacks.slice(i + 1)];
                    break;
                }
            }
        };

        /**
         * This callback is called when the execution of a function body completes
         *
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {*} returnVal - The value returned by the function
         * @param {{exception:*} | undefined} wrappedExceptionVal - If this parameter is an object, the function
         * execution has thrown an uncaught exception and the exception is being stored in the <tt>exception</tt>
         * property of the parameter
         * @returns {{returnVal: *, wrappedExceptionVal: *, isBacktrack: boolean}}  If an object is returned, then the
         * actual <tt>returnVal</tt> and <tt>wrappedExceptionVal.exception</tt> are replaced with that from the
         * returned object. If an object is returned and the property <tt>isBacktrack</tt> is set, then the control-flow
         * returns to the beginning of the function body instead of returning to the caller.  The property
         * <tt>isBacktrack</tt> can be set to <tt>true</tt> to repeatedly execute the function body as in MultiSE
         * symbolic execution.
         * */
        this.functionExit = function (iid, returnVal, wrappedExceptionVal)
        {
            if (currentCallback.type === 'interval' || currentCallback.type === 'eventListener')
            {
                // Do not put reference back again. We need a new object to distinguish different calls
                callbacks.push(new Callback(currentCallback.func, currentCallback.type, currentCallback.scope, currentCallback.register));
            }

        };

        /**
         * This callback is called before a function, method, or constructor invocation.
         *
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {function} f - The function object that going to be invoked
         * @param {object} base - The receiver object for the function <tt>f</tt>
         * @param {Array} args - The array of arguments passed to <tt>f</tt>
         * @param {boolean} isConstructor - True if <tt>f</tt> is invoked as a constructor
         * @param {boolean} isMethod - True if <tt>f</tt> is invoked as a method
         * @param {number} functionIid - The iid (i.e. the unique instruction identifier) where the function was created
         * @param {number} functionSid - The sid (i.e. the unique script identifier) where the function was created
         * {@link MyAnalysis#functionEnter} when the function <tt>f</tt> is executed.  The <tt>functionIid</tt> can be
         * treated as the static identifier of the function <tt>f</tt>.  Note that a given function code block can
         * create several function objects, but each such object has a common <tt>functionIid</tt>, which is the iid
         * that is passed to {@link MyAnalysis#functionEnter} when the function executes.
         * @returns {{f: function, base: Object, args: Array, skip: boolean}|undefined} - If an object is returned and
         * the <tt>skip</tt> property of the object is true, then the invocation operation is skipped.
         * Original <tt>f</tt>, <tt>base</tt>, and <tt>args</tt> are replaced with that from the returned object if
         * an object is returned.
         * */
        this.invokeFunPre = function (iid, f, base, args, isConstructor, isMethod, functionIid, functionSid)
        {
            const {
                name,
                range,
            } = sandbox.iidToSourceObject(iid);
            const register = new CallbackRegister(name, new Range(range[0], range[1]));
            if (f === setTimeout)
            {
                const callback = args[0];
                callbacks.push(new Callback(callback, 'timeout', currentCallback, register));
            }
            else if (f === setImmediate)
            {
                const callback = args[0];
                callbacks.push(new Callback(callback, 'immediate', currentCallback, register));
            }
            else if (f === setInterval)
            {
                const callback = args[0];
                callbacks.push(new Callback(callback, 'interval', currentCallback, register));
            }
            else if (f === process.nextTick)
            {
                const callback = args[0];
                callbacks.push(new Callback(callback, 'nextTick', currentCallback, register));
            }
            else if (f === Promise.prototype.then)
            {
                const resolve = args[0];
                const reject = args[1];
                if (typeof resolve === 'function')
                {
                    callbacks.push(new Callback(resolve, 'promiseThen', currentCallback, register));
                }
                if (typeof reject === 'function')
                {
                    callbacks.push(new Callback(reject, 'promiseThen', currentCallback, register));
                }
            }
            else if (f === Promise.prototype.catch)
            {
                const reject = args[1];
                if (typeof reject === 'function')
                {
                    callbacks.push(new Callback(reject, 'promiseThen', currentCallback, register));
                }
            }
            // TODO: other Promise apis

            else if (f === EventEmitter.prototype.on || f === EventEmitter.prototype.once)
            {
                const callback = args[1];
                callbacks.push(new Callback(callback, 'eventListener', currentCallback, register));
            }
        };

        /**
         * This callback is called after a function, method, or constructor invocation.
         *
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {function} f - The function object that was invoked
         * @param {*} base - The receiver object for the function <tt>f</tt>
         * @param {Array} args - The array of arguments passed to <tt>f</tt>
         * @param {*} result - The value returned by the invocation
         * @param {boolean} isConstructor - True if <tt>f</tt> is invoked as a constructor
         * @param {boolean} isMethod - True if <tt>f</tt> is invoked as a method
         * @param {number} functionIid - The iid (i.e. the unique instruction identifier) where the function was created
         * @param {number} functionSid - The sid (i.e. the unique script identifier) where the function was created
         * {@link MyAnalysis#functionEnter} when the function f is executed.  <tt>functionIid</tt> can be treated as the
         * static identifier of the function <tt>f</tt>.  Note that a given function code block can create several function
         * objects, but each such object has a common <tt>functionIid</tt>, which is the iid that is passed to
         * {@link MyAnalysis#functionEnter} when the function executes.
         * @returns {{result: *}| undefined} - If an object is returned, the return value of the invoked function is
         * replaced with the value stored in the <tt>result</tt> property of the object.  This enables one to change the
         * value that is returned by the actual function invocation.
         * */
        this.invokeFun = function (iid, f, base, args, result, isConstructor, isMethod, functionIid, functionSid)
        {

        };
    }

    sandbox.analysis = new AsyncApi();
})(J$);
