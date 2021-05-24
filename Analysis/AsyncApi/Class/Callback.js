class Callback
{
    /**
     * @param {function | null} func
     * @param {'global'|'immediate'|'timeout'|'interval' | 'nextTick' | 'promiseThen'|'eventListener'|'eventListenerOnce'} type
     * @param {Callback | null} scope
     * @param {CallbackRegister | null} register
     * */
    constructor(func, type, scope, register)
    {
        this.funcName = func === null ? 'global' : func.name ? func.name : 'anonymous';
        this.func = func;
        this.type = type;
        this.scope = scope; // 被创建时所在的 scope
        this.register = register;   // 本 callback 是被什么地方的代码注册执行的
    }
}

module.exports = Callback;