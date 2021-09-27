// DO NOT INSTRUMENT

import {CallbackFunction} from '../LogStore/Class/CallbackFunction';
import {ResourceOperation} from '../LogStore/Class/ResourceOperation';
import {ObjectDeclaration, ObjectOperation} from '../LogStore/ObjectLogStore';
import {ViolationInfo} from './ViolationInfo';
import {EnhancedSet} from '@datastructures-js/set';

/**
 * Check if the operations of the ViolationInfo changed the same fields. Otherwise it's a FP
 */
export function changedSameFields(violationInfo: ViolationInfo, callbackToOperations: [CallbackFunction, readonly ResourceOperation[]][]): boolean
{
    const {
        resourceDeclaration,
        atomicOperationsPairIndexes,
        violatingOperationIndex,
    } = violationInfo;

    // Check if the operations read/write on the same fields
    if (resourceDeclaration instanceof ObjectDeclaration)
    {
        const atomicPair = [
            callbackToOperations[atomicOperationsPairIndexes[0]],
            callbackToOperations[atomicOperationsPairIndexes[1]],
        ];
        const violator = callbackToOperations[violatingOperationIndex]!;

        const atomicPairOperations = [
            atomicPair[0]![1], atomicPair[1]![1],
        ] as [ObjectOperation[], ObjectOperation[]];
        const violatorOperations = violator[1] as ObjectOperation[];

        let atomicPair1OperationFieldsSet: EnhancedSet<any> | null = new EnhancedSet<any>();
        for (const {field} of atomicPairOperations[0]!)
        {
            if (field === null) // null means all fields may be read/written
            {
                atomicPair1OperationFieldsSet = null;   // null means all fields
                break;
            }
            atomicPair1OperationFieldsSet.add(field);
        }

        let atomicPair2OperationFieldsSet: EnhancedSet<any> | null = new EnhancedSet<any | null>();
        for (const {field} of atomicPairOperations[1]!)
        {
            if (field === null) // null means all fields may be read/written
            {
                atomicPair2OperationFieldsSet = null;   // null means all fields
                break;
            }
            atomicPair2OperationFieldsSet.add(field);
        }

        let atomicFieldsSet: EnhancedSet<any> | null = null;
        if (atomicPair1OperationFieldsSet === null && atomicPair2OperationFieldsSet === null)
        {
            atomicFieldsSet = null;
        }
        else if (atomicPair1OperationFieldsSet !== null && atomicPair2OperationFieldsSet === null)
        {
            atomicFieldsSet = atomicPair1OperationFieldsSet;
        }
        else if (atomicPair1OperationFieldsSet === null && atomicPair2OperationFieldsSet !== null)
        {
            atomicFieldsSet = atomicPair2OperationFieldsSet;
        }
        else if (atomicPair1OperationFieldsSet !== null && atomicPair2OperationFieldsSet !== null)
        {
            atomicFieldsSet = atomicPair1OperationFieldsSet.intersect(atomicPair2OperationFieldsSet);
        }

        if (atomicFieldsSet === null)   // all fields are atomic
        {
            return true;
        }

        let violatorOperationFieldsSet: EnhancedSet<any> | null = new EnhancedSet<any | null>();
        for (let i = 0; i < violatorOperations.length; i++)
        {
            const violatorOperation = violatorOperations[i]!;
            const {field} = violatorOperation;
            if (field === null) // null means all fields may be read/written
            {
                violatorOperationFieldsSet = null;   // null means all fields
                break;
            }
            if (violatorOperation.getType() === 'write')
            {
                violatorOperationFieldsSet.add(field);
            }
        }

        if (violatorOperationFieldsSet === null)
        {
            return true;
        }
        else
        {
            return atomicFieldsSet.intersect(violatorOperationFieldsSet).size !== 0;
        }
    }
    else
    {
        return true;
    }
}