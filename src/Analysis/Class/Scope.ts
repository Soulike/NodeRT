// DO NOT INSTRUMENT

import ScopeType from '../Type/ScopeType';
import VariableDeclaration from '../PrimitiveAsyncRace/Class/VariableDeclaration';
import FunctionDeclaration from './FunctionDeclaration';

class Scope
{
    public static globalScope = new Scope('global', null);	// 只能构造一次
    private readonly type: ScopeType;	// 作用域类型
    private readonly variableDeclarations: VariableDeclaration[];	// 这个作用域里声明的变量
    private readonly functionDeclarations: FunctionDeclaration[];	// 这个作用域里创造的函数对象
    private readonly parentScope: Scope | null;	// 该作用域的父作用域

    constructor(type: ScopeType, parentScope: Scope | null)
    {
        this.type = type;
        this.parentScope = parentScope;
        this.variableDeclarations = [];
        this.functionDeclarations = [];
    }

    public getType()
    {
        return this.type;
    }

    /**
     * Find `variableName` in `this.variableDeclarations`. If fails, try to find it from `parentScope.findVariableDeclaration()`
     * */
    public findVariableDeclaration(variableName: string): VariableDeclaration | null
    {
        for (let i = this.variableDeclarations.length - 1; i >= 0; i--)
        {
            const variableDeclaration = this.variableDeclarations[i]!;
            if (variableDeclaration.name === variableName)
            {
                return variableDeclaration;
            }
        }
        if (this.parentScope === null)   // global
        {
            return null;
        }
        else
        {
            return this.parentScope.findVariableDeclaration(variableName);
        }
    }

    public addVariableDeclaration(variableDeclaration: VariableDeclaration)
    {
        this.variableDeclarations.push(variableDeclaration);
    }

    /**
     * Find `func` in `this.functionDeclarations`. If fails, try to find it from `parentScope.findFunctionDeclaration()`
     * */
    public findFunctionDeclaration(func: Function): FunctionDeclaration | null
    {
        for (let i = this.functionDeclarations.length - 1; i >= 0; i--)
        {
            const functionDeclaration = this.functionDeclarations[i]!;
            if (functionDeclaration.isFunction(func))
            {
                return functionDeclaration;
            }
        }
        if (this.parentScope === null)   // global
        {
            return null;
        }
        else
        {
            return this.parentScope.findFunctionDeclaration(func);
        }
    }

    public addFunctionDeclaration(functionDeclaration: FunctionDeclaration)
    {
        this.functionDeclarations.push(functionDeclaration);
    }

    public getParentScope()
    {
        return this.parentScope;
    }

    /**
     * For avoiding circular reference
     * */
    public toJSON()
    {
        return {
            ...this,
            variableDeclarations: '[Array<VariableDeclaration>]',
            functionDeclarations: '[Array<FunctionDeclaration>]',
        };
    }
}

export default Scope;