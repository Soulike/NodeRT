// DO NOT INSTRUMENT

const Callback = require('./AsyncApi/Class/Callback');
const VariableDeclare = require('./AsyncApi/Class/VariableDeclare');
const VariableOperation = require('./AsyncApi/Class/VariableOperation');
const SourceCodeInfo = require('./AsyncApi/Class/SourceCodeInfo');
const Range = require('./AsyncApi/Class/Range');
const EventEmitter = require('events');
const {toJSON} = require('./AsyncApi/Util');

(function (sandbox)
{
    function AsyncApi()
    {
        /**@type Callback*/
        let currentCallback = new Callback(null, 'global', null, null);

        /**@type Array<Callback>*/
        let pendingCallbacks = [];  // TODO: clean dead callbacks

        /**@type VariableDeclare[]*/
        const variableDeclares = [];

        process.on('exit', () =>
        {
            console.log(toJSON(variableDeclares));
        });

        this.declare = function (iid, name, type, kind)
        {
            variableDeclares.push(new VariableDeclare(name, currentCallback, null));
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
            if (isGlobal)
            {
                const declaration = new VariableDeclare(name, currentCallback, null);
                const newOperation = new VariableOperation('write', val);
                declaration.operations.set(currentCallback, [newOperation]);
            }
            else
            {
                for (let i = variableDeclares.length - 1; i >= 0; i--)
                {
                    const declare = variableDeclares[i];
                    if (declare.name === name)
                    {
                        const newOperation = new VariableOperation('write', val);
                        // append the operation to current callback
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
            }
        };

        /**
         * This callback is called after a property of an object is accessed.
         *
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {*} base - Base object
         * @param {string|*} offset - Property
         * @param {*} val - Value of <code>base[offset]</code>
         * @param {boolean} isComputed - True if property is accessed using square brackets.  For example,
         * <tt>isComputed</tt> is <tt>true</tt> if the get field operation is <tt>o[p]</tt>, and <tt>false</tt>
         * if the get field operation is <tt>o.p</tt>
         * @param {boolean} isOpAssign - True if the operation is of the form <code>o.p op= e</code>
         * @param {boolean} isMethodCall - True if the get field operation is part of a method call (e.g. <tt>o.p()</tt>)
         * @returns {{result: *} | undefined} - If an object is returned, the value of the get field operation  is
         * replaced with the value stored in the <tt>result</tt> property of the object.
         * */
        this.getField = function (iid, base, offset, val, isComputed, isOpAssign, isMethodCall)
        {
            for (let i = variableDeclares.length - 1; i >= -1; i--)
            {
                if (i === -1)   // not found in variableDeclares, newly created field
                {
                    const declare = new VariableDeclare(offset, currentCallback, base);
                    declare.operations.set(currentCallback, [
                        new VariableOperation('read', val),
                    ]);
                    variableDeclares.push(declare);
                    break;
                }

                const declare = variableDeclares[i];
                if (declare.name === offset && declare.base === base)
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
         * This callback is called before a property of an object is written.
         *
         * @param {number} iid - Static unique instruction identifier of this callback
         * @param {*} base - Base object
         * @param {*} offset - Property
         * @param {*} val - Value to be stored in <code>base[offset]</code>
         * @param {boolean} isComputed - True if property is accessed using square brackets.  For example,
         * <tt>isComputed</tt> is <tt>true</tt> if the get field operation is <tt>o[p]</tt>, and <tt>false</tt>
         * if the get field operation is <tt>o.p</tt>
         * @param {boolean} isOpAssign - True if the operation is of the form <code>o.p op= e</code>
         * @returns {{base: *, offset: *, val: *, skip: boolean} | undefined} -  If an object is returned and the <tt>skip</tt>
         * property is true, then the put field operation is skipped.  Original <tt>base</tt>, <tt>offset</tt>, and
         * <tt>val</tt> are replaced with that from the returned object if an object is returned.
         * */
        this.putFieldPre = function (iid, base, offset, val, isComputed, isOpAssign)
        {
            for (let i = variableDeclares.length - 1; i >= -1; i--)
            {
                if (i === -1)   // not found in variableDeclares, newly created field
                {
                    const declare = new VariableDeclare(offset, currentCallback, base);
                    declare.operations.set(currentCallback, [
                        new VariableOperation('write', val),
                    ]);
                    variableDeclares.push(declare);
                    break;
                }

                const declare = variableDeclares[i];
                if (declare.name === offset && declare.base === base)
                {
                    const newOperation = new VariableOperation('write', val);
                    // append the operation to current callback
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
            const pendingCallbacksCopy = Array.from(pendingCallbacks);
            for (let i = 0; i < pendingCallbacksCopy.length; i++)
            {
                const pendingCallback = pendingCallbacksCopy[i];
                if (pendingCallback.func === f)    // switch to the next pending callback
                {
                    onCallbackExit();
                    currentCallback = pendingCallback;
                    pendingCallbacks = [...pendingCallbacks.slice(0, i), ...pendingCallbacks.slice(i + 1)];
                    break;
                }
            }
        };

        /**
         * Jobs when currentCallback changes
         * */
        function onCallbackExit()
        {
            // may be called again, put the callback back to `pendingCallbacks`
            if (currentCallback.type === 'interval' || currentCallback.type === 'eventListener')
            {
                const {
                    func,
                    type,
                    scope,
                    register,
                } = currentCallback;
                // Do not put reference back again. We need a new object to distinguish different calls
                pendingCallbacks.push(new Callback(func, type, scope, register));
            }
        }

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
            const register = new SourceCodeInfo(name, new Range(range[0], range[1]));
            if (f === setTimeout)
            {
                const callback = args[0];
                pendingCallbacks.push(new Callback(callback, 'timeout', currentCallback, register));
            }
            else if (f === setImmediate)
            {
                const callback = args[0];
                pendingCallbacks.push(new Callback(callback, 'immediate', currentCallback, register));
            }
            else if (f === setInterval)
            {
                const callback = args[0];
                pendingCallbacks.push(new Callback(callback, 'interval', currentCallback, register));
            }
            else if (f === process.nextTick)
            {
                const callback = args[0];
                pendingCallbacks.push(new Callback(callback, 'nextTick', currentCallback, register));
            }
            else if (f === Promise.prototype.then)
            {
                const resolve = args[0];
                const reject = args[1];
                if (typeof resolve === 'function')
                {
                    pendingCallbacks.push(new Callback(resolve, 'promiseThen', currentCallback, register));
                }
                if (typeof reject === 'function')
                {
                    pendingCallbacks.push(new Callback(reject, 'promiseThen', currentCallback, register));
                }
            }
            else if (f === Promise.prototype.catch || f === Promise.prototype.finally)
            {
                const callback = args[1];
                if (typeof callback === 'function')
                {
                    pendingCallbacks.push(new Callback(callback, 'promiseThen', currentCallback, register));
                }
            }
            else if (f === EventEmitter.prototype.on)
            {
                const callback = args[1];
                pendingCallbacks.push(new Callback(callback, 'eventListener', currentCallback, register));
            }
            else if (f === EventEmitter.prototype.once)
            {
                const callback = args[1];
                pendingCallbacks.push(new Callback(callback, 'eventListenerOnce', currentCallback, register));
            }
        };
    }

    sandbox.analysis = new AsyncApi();
})(J$);
