import {EnhancedSet} from '@datastructures-js/set';
import {ObjectOperation} from '../LogStore/ObjectLogStore';
import {ViolationInfo} from './ViolationInfo';
import objectHash from 'object-hash';
import assert from 'assert';
import {ResourceDeclaration} from '../LogStore/Class/ResourceDeclaration';
import {ObjectInfo} from '../LogStore/ObjectLogStore/Class/ObjectInfo';
import {SocketInfo} from '../LogStore/SocketLogStore/Class/SocketInfo';
import {SocketOperation} from '../LogStore/SocketLogStore/Class/SocketOperation';
import {OutgoingMessageInfo} from '../LogStore/OutgoingMessageLogStore/Class/OutgoingMessageInfo';
import {OutgoingMessageOperation} from '../LogStore/OutgoingMessageLogStore/Class/OutgoingMessageOperation';

export class Filter
{
    private static readonly reportedViolation = new Map<ResourceDeclaration, Set<string>>();

    public static isTruePositive(violationInfo: ViolationInfo): boolean
    {
        const {
            resourceInfo,
        } = violationInfo;

        if (resourceInfo instanceof ObjectInfo)
        {
            return Filter.changedSameFields(violationInfo);
        }
        else if (resourceInfo instanceof SocketInfo || resourceInfo instanceof OutgoingMessageInfo)
        {
            return Filter.isSocketOrOutgoingMessageViolationTP(violationInfo);
        }
        else
        {
            return true;
        }
    }

    /**
     * Check if the operations of the ViolationInfo changed the same fields. Otherwise it's a FP
     */
    private static changedSameFields(violationInfo: ViolationInfo): boolean
    {
        const {
            resourceInfo,
            atomicAsyncContextToOperations1, atomicAsyncContextToOperations2,
            violatingAsyncContextToOperations,
        } = violationInfo;

        assert.ok(resourceInfo instanceof ObjectInfo);
        // Check if the operations read/write on the same fields
        const atomicPairOperations = [
            atomicAsyncContextToOperations1[1], atomicAsyncContextToOperations2[1],
        ] as [ObjectOperation[], ObjectOperation[]];
        const violatorOperations = violatingAsyncContextToOperations[1] as ObjectOperation[];

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

    private static isSocketOrOutgoingMessageViolationTP(violationInfo: ViolationInfo): boolean
    {
        const {resourceInfo, atomicAsyncContextToOperations2} = violationInfo;
        assert.ok(resourceInfo instanceof SocketInfo || resourceInfo instanceof OutgoingMessageInfo);

        const atomicAsyncContextToOperations2Operations = atomicAsyncContextToOperations2[1];
        const atomicAsyncContextToOperations2LastOperation =
            atomicAsyncContextToOperations2Operations[atomicAsyncContextToOperations2Operations.length - 1];
        assert.ok(atomicAsyncContextToOperations2LastOperation instanceof SocketOperation
            || atomicAsyncContextToOperations2LastOperation instanceof OutgoingMessageOperation);

        return atomicAsyncContextToOperations2LastOperation.getOperationKind() !== 'destroy';
    }

    /**
     * Calculate an unique hash for a ViolationInfo
     * if any of the callbacks is invoked by C++ modules, which is not able to be hashed, returns null
     */
    private static getViolationInfoHash(violationInfo: ViolationInfo): string | null
    {
        const {
            atomicAsyncContextToOperations1, atomicAsyncContextToOperations2,
            violatingAsyncContextToOperations,
        } = violationInfo;

        const [atomicAsyncCalledFunction1, atomicAsyncCalledFunction2] = [
            atomicAsyncContextToOperations1[0].functionWeakRef,
            atomicAsyncContextToOperations2[0].functionWeakRef,
        ];
        const violatingAsyncCalledFunction = violatingAsyncContextToOperations[0].functionWeakRef;
        if (atomicAsyncCalledFunction2 === null)
        {
            return null;
        }
        if (violatingAsyncCalledFunction === null)
        {
            return null;
        }
        const callbackFunction1Ref = atomicAsyncCalledFunction1 === null ? null : atomicAsyncCalledFunction1.deref;
        const callbackFunction2Ref = atomicAsyncCalledFunction2.deref;
        const violatorFunctionRef = violatingAsyncCalledFunction.deref;

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