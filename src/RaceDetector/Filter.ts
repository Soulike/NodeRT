import {EnhancedSet} from '@datastructures-js/set';
import {ObjectDeclaration, ObjectOperation} from '../LogStore/ObjectLogStore';
import {ViolationInfo} from './ViolationInfo';
import objectHash from 'object-hash';
import assert from 'assert';

export class Filter
{
    private static readonly reportedViolation = new Set<string>();

    /**
     * Check if the operations of the ViolationInfo changed the same fields. Otherwise it's a FP
     */
    public static changedSameFields(violationInfo: ViolationInfo): boolean
    {
        const {
            resourceDeclaration,
            atomicOperationsPairIndexes,
            violatingOperationIndex,
        } = violationInfo;

        // Check if the operations read/write on the same fields
        if (resourceDeclaration instanceof ObjectDeclaration)
        {
            const callbackToOperations = Array.from(resourceDeclaration.getCallbackFunctionToOperations());

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

    private static getViolationInoHash(violationInfo: ViolationInfo): string
    {
        const {
            resourceDeclaration,
            atomicOperationsPairIndexes,
            violatingOperationIndex,
        } = violationInfo;

        const callbackToOperations = Array.from(resourceDeclaration.getCallbackFunctionToOperations());

        const [callback1, callback2] = [
            callbackToOperations[atomicOperationsPairIndexes[0]]![0].functionWeakRef,
            callbackToOperations[atomicOperationsPairIndexes[1]]![0].functionWeakRef,
        ];
        const violator = callbackToOperations[violatingOperationIndex]![0].functionWeakRef;

        assert.ok(callback2 !== null);
        assert.ok(violator !== null);
        const callbackFunction1Ref = callback1 === null ? null : callback1.deref;
        const callbackFunction2Ref = callback2.deref;
        const violatorFunctionRef = violator.deref;

        assert.ok(callbackFunction1Ref !== undefined);
        assert.ok(callbackFunction2Ref !== undefined);
        assert.ok(violatorFunctionRef !== undefined);

        return [
            objectHash.MD5(callbackFunction1Ref),
            objectHash.MD5(callbackFunction2Ref),
            objectHash.MD5(violatorFunctionRef),
        ].join(',');
    }

    /**
     * Check if the ViolationInfo has been reported
     */
    public static hasReported(violationInfo: ViolationInfo): boolean
    {
        const hash = Filter.getViolationInoHash(violationInfo);
        return Filter.reportedViolation.has(hash);
    }

    public static addReported(violationInfo: ViolationInfo): void
    {
        const hash = Filter.getViolationInoHash(violationInfo);
        Filter.reportedViolation.add(hash);
    }
}