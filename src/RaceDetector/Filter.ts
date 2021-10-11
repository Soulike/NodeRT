import {EnhancedSet} from '@datastructures-js/set';
import {ObjectDeclaration, ObjectOperation} from '../LogStore/ObjectLogStore';
import {ViolationInfo} from './ViolationInfo';
import objectHash from 'object-hash';
import assert from 'assert';
import {ResourceDeclaration} from '../LogStore/Class/ResourceDeclaration';

export class Filter
{
    private static readonly reportedViolation = new Map<ResourceDeclaration, Set<string>>();

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
    /**
     * if any of the callbacks is invoked by C++ modules, which is not able to be hashed, returns null
     */
    private static getViolationInfoHash(violationInfo: ViolationInfo): string | null
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
        if (callback2 === null)
        {
            return null;
        }
        if (violator === null)
        {
            return null;
        }
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
    public static hasReported(resourceDeclaration: ResourceDeclaration, violationInfo: ViolationInfo): boolean
    {
        const hashes = Filter.reportedViolation.get(resourceDeclaration);
        if (hashes === undefined)
        {
            return false;
        }
        const hash = Filter.getViolationInfoHash(violationInfo);
        if (hash === null)
        {
            return false;
        }
        else
        {
            return hashes.has(hash);
        }
    }

    public static addReported(resourceDeclaration: ResourceDeclaration, violationInfo: ViolationInfo): void
    {
        let hashes = Filter.reportedViolation.get(resourceDeclaration) ?? new Set();
        const hash = Filter.getViolationInfoHash(violationInfo);
        if (hash !== null)
        {
            hashes.add(hash);
        }
        Filter.reportedViolation.set(resourceDeclaration, hashes);
    }
}