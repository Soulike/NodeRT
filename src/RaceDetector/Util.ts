// DO NOT INSTRUMENT

import {CallbackFunction} from '../LogStore/Class/CallbackFunction';
import {ResourceOperation} from '../LogStore/Class/ResourceOperation';
import {ObjectDeclaration, ObjectOperation} from '../LogStore/ObjectLogStore';
import {ViolationInfo} from './ViolationInfo';
import {EnhancedSet} from '@datastructures-js/set';

/**
 * Check if the violationInfo is a FP
 */
export function shouldOutput(violationInfo: ViolationInfo, callbackToOperations: [CallbackFunction, readonly ResourceOperation[]][]): boolean
{
    const {
        resourceDeclaration,
        atomicOperationsPairIndexes,
        violatingOperationIndex} = violationInfo;
    
    // Check if the operations read/write on the same fields
    if (resourceDeclaration instanceof ObjectDeclaration)
    {
        const atomicPair = [
            callbackToOperations[atomicOperationsPairIndexes[0]],
            callbackToOperations[atomicOperationsPairIndexes[1]]
        ];
        const violator = callbackToOperations[violatingOperationIndex]!;

        const atomicPairOperations = [
            atomicPair[0]![1], atomicPair[1]![1]
        ] as [ObjectOperation[], ObjectOperation[]];
        const violatorOperations = violator[1] as ObjectOperation[];

        const atomicPair1OperationFieldsSet = new EnhancedSet<any | null>();
        for (const {field} of atomicPairOperations[0]!)
        {
            if (field === null) // null means all fields may be read/written. returns true
            {
                return true;
            }
            atomicPair1OperationFieldsSet.add(field);
        }

        const atomicPair2OperationFieldsSet = new EnhancedSet<any | null>();
        for (const {field} of atomicPairOperations[1]!)
        {
            if (field === null)
            {
                return true;
            }
            atomicPair2OperationFieldsSet.add(field);
        }

        const violatorOperationFieldsSet = new EnhancedSet<any | null>();
        for (const {field} of violatorOperations)
        {
            if (field === null)
            {
                return true;
            }
            violatorOperationFieldsSet.add(field);
        }

        return atomicPair1OperationFieldsSet
            .intersect(atomicPair2OperationFieldsSet)
            .intersect(violatorOperationFieldsSet)
            .size !== 0;

    }
    else
    {
        return true;
    }
}