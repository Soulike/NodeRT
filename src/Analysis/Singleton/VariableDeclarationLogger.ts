// DO NOT INSTRUMENT

import VariableDeclaration from '../PrimitiveAsyncRace/Class/VariableDeclaration';

class VariableDeclarationLogger
{
    private static readonly variableDeclarations: VariableDeclaration[] = [];

    public static addVariableDeclaration(variableDeclaration: VariableDeclaration)
    {
        this.variableDeclarations.push(variableDeclaration);
    }

    public static getVariableDeclarationsClone()
    {
        return Array.from(VariableDeclarationLogger.variableDeclarations);
    }
}

export default VariableDeclarationLogger;