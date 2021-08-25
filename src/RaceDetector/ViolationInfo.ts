// DO NOT INSTRUMENT

import {ResourceDeclaration} from '../LogStore/Class/ResourceDeclaration';

export class ViolationInfo
{
    public readonly resourceDeclaration: ResourceDeclaration;
    
    // indexes of resourceOperations in ResourceDeclaration.operations
    public readonly atomicOperationsPairIndexes: [number, number];
    public readonly violatingOperationIndex: number;

    constructor(resourceDeclaration: ResourceDeclaration, atomicOperationsPairIndexes: [number, number], violatingOperationIndex: number)
    {
        this.resourceDeclaration = resourceDeclaration;
        this.atomicOperationsPairIndexes = atomicOperationsPairIndexes;
        this.violatingOperationIndex = violatingOperationIndex;
    }
}