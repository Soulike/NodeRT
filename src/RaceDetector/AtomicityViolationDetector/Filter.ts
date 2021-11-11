import {EnhancedSet} from '@datastructures-js/set';
import {ObjectOperation} from '../../LogStore/ObjectLogStore';
import {ViolationInfo} from './ViolationInfo';
import objectHash from 'object-hash';
import assert from 'assert';
import {ResourceDeclaration} from '../../LogStore/Class/ResourceDeclaration';
import {ObjectInfo} from '../../LogStore/ObjectLogStore/Class/ObjectInfo';
import {SocketInfo} from '../../LogStore/SocketLogStore/Class/SocketInfo';
import {SocketOperation} from '../../LogStore/SocketLogStore/Class/SocketOperation';
import {OutgoingMessageInfo} from '../../LogStore/OutgoingMessageLogStore/Class/OutgoingMessageInfo';
import {OutgoingMessageOperation} from '../../LogStore/OutgoingMessageLogStore/Class/OutgoingMessageOperation';
import {StreamInfo} from '../../LogStore/StreamLogStore/Class/StreamInfo';
import {EventEmitterInfo} from '../../LogStore/EventEmitterLogStore/Class/EventEmitterInfo';
import {EventEmitterOperation} from '../../LogStore/EventEmitterLogStore/Class/EventEmitterOperation';
import {FileInfo} from '../../LogStore/FileLogStore/Class/FileInfo';
import {FileOperation} from '../../LogStore/FileLogStore';

export class Filter
{
    private static readonly reportedViolation = new Map<ResourceDeclaration, Set<string>>();

    public static isTruePositive(violationInfo: ViolationInfo): boolean
    {
        const {
            resourceInfo,
        } = violationInfo;

        if (!this.isPromiseViolationTP(violationInfo))
        {
            return false;
        }

        if (resourceInfo instanceof ObjectInfo)
        {
            return Filter.isObjectViolationTP(violationInfo);
        }
        else if (resourceInfo instanceof OutgoingMessageInfo)
        {
            return Filter.isOutgoingMessageViolationTP(violationInfo);
        }
        else if (resourceInfo instanceof SocketInfo)
        {
            return Filter.isSocketViolationTP(violationInfo);
        }
        else if (resourceInfo instanceof StreamInfo)
        {
            return Filter.isStreamViolationTP(violationInfo);
        }
        else if (resourceInfo instanceof EventEmitterInfo)
        {
            return Filter.isEventEmitterViolationTP(violationInfo);
        }
        else if (resourceInfo instanceof FileInfo)
        {
            return Filter.isFileViolationTP(violationInfo);
        }
        else
        {
            return true;
        }
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

    /**
     * Check if the operations of the ViolationInfo changed the same fields. Otherwise it's a FP
     */
    private static isObjectViolationTP(violationInfo: ViolationInfo): boolean
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

        let atomicPair1OperationFieldsSet = new EnhancedSet();
        for (const {fields} of atomicPairOperations[0]!)
        {
            fields.forEach(field => atomicPair1OperationFieldsSet.add(field));
        }

        let atomicPair2OperationFieldsSet = new EnhancedSet();
        for (const {fields} of atomicPairOperations[1]!)
        {
            fields.forEach(field => atomicPair2OperationFieldsSet.add(field));
        }

        const atomicFieldsSet = atomicPair1OperationFieldsSet.intersect(atomicPair2OperationFieldsSet);

        let violatorOperationFieldsSet = new EnhancedSet();
        for (let i = 0; i < violatorOperations.length; i++)
        {
            const violatorOperation = violatorOperations[i]!;
            const {fields} = violatorOperation;
            if (violatorOperation.getType() === 'write')
            {
                fields.forEach(field => violatorOperationFieldsSet.add(field));
            }
        }

        return atomicFieldsSet.intersect(violatorOperationFieldsSet).size !== 0;
    }

    private static isOutgoingMessageViolationTP(violationInfo: ViolationInfo): boolean
    {
        const {resourceInfo, violatingAsyncContextToOperations} = violationInfo;
        assert.ok(resourceInfo instanceof OutgoingMessageInfo);

        const violatingAsyncContextToOperationsOperations = violatingAsyncContextToOperations[1];
        const violatingAsyncContextToOperationsLastOperation =
            violatingAsyncContextToOperationsOperations[violatingAsyncContextToOperationsOperations.length - 1];
        assert.ok(violatingAsyncContextToOperationsLastOperation instanceof OutgoingMessageOperation);

        const violatingAsyncContextToOperationsLastOperationKind = violatingAsyncContextToOperationsLastOperation.getOperationKind();

        return violatingAsyncContextToOperationsLastOperationKind === 'end'
            || violatingAsyncContextToOperationsLastOperationKind === 'destroy';
    }

    private static isSocketViolationTP(violationInfo: ViolationInfo): boolean
    {
        const {resourceInfo, atomicAsyncContextToOperations2, violatingAsyncContextToOperations} = violationInfo;
        assert.ok(resourceInfo instanceof SocketInfo);

        const violatingAsyncContextToOperationsOperations = violatingAsyncContextToOperations[1];
        const violatingAsyncContextToOperationsLastOperation =
            violatingAsyncContextToOperationsOperations[violatingAsyncContextToOperationsOperations.length - 1];
        assert.ok(violatingAsyncContextToOperationsLastOperation instanceof SocketOperation);

        const atomicAsyncContextToOperations2Operations = atomicAsyncContextToOperations2[1];
        const atomicAsyncContextToOperations2LastOperation =
            atomicAsyncContextToOperations2Operations[atomicAsyncContextToOperations2Operations.length - 1];
        assert.ok(atomicAsyncContextToOperations2LastOperation instanceof SocketOperation);

        const atomicAsyncContextToOperations2LastOperationKind = atomicAsyncContextToOperations2LastOperation.getOperationKind();
        const atomicAsyncContextToOperations2LastOperationType = atomicAsyncContextToOperations2LastOperation.getType();

        const violatingAsyncContextToOperationsLastOperationKind = violatingAsyncContextToOperationsLastOperation.getOperationKind();

        return !(atomicAsyncContextToOperations2LastOperationKind === 'destroy'
            || (violatingAsyncContextToOperationsLastOperationKind === 'connection' && atomicAsyncContextToOperations2LastOperationType === 'write'));
    }

    private static isStreamViolationTP(violationInfo: ViolationInfo): boolean
    {
        const {resourceInfo, violatingAsyncContextToOperations} = violationInfo;
        assert.ok(resourceInfo instanceof StreamInfo);

        const violatingAsyncContextToOperationsOperations = violatingAsyncContextToOperations[1];
        const violatingAsyncContextToOperationsLastOperation =
            violatingAsyncContextToOperationsOperations[violatingAsyncContextToOperationsOperations.length - 1];
        assert.ok(violatingAsyncContextToOperationsLastOperation instanceof OutgoingMessageOperation);

        const violatingAsyncContextToOperationsLastOperationKind = violatingAsyncContextToOperationsLastOperation.getOperationKind();

        return violatingAsyncContextToOperationsLastOperationKind === 'end'
            || violatingAsyncContextToOperationsLastOperationKind === 'destroy';
    }

    private static isEventEmitterViolationTP(violationInfo: ViolationInfo): boolean
    {
        const {resourceInfo, violatingAsyncContextToOperations} = violationInfo;
        assert.ok(resourceInfo instanceof EventEmitterInfo);

        const violatingAsyncContextToOperationsOperations = violatingAsyncContextToOperations[1];
        const violatingAsyncContextToOperationsLastOperation =
            violatingAsyncContextToOperationsOperations[violatingAsyncContextToOperationsOperations.length - 1];
        assert.ok(violatingAsyncContextToOperationsLastOperation instanceof EventEmitterOperation);

        const violatingAsyncContextToOperationsLastOperationKind = violatingAsyncContextToOperationsLastOperation.getOperationKind();

        return violatingAsyncContextToOperationsLastOperationKind !== 'addListener';
    }

    private static isFileViolationTP(violationInfo: ViolationInfo): boolean
    {
        const {resourceInfo, violatingAsyncContextToOperations, atomicAsyncContextToOperations2} = violationInfo;
        assert.ok(resourceInfo instanceof FileInfo);
        const violatingAsyncContextOperations = violatingAsyncContextToOperations[1];
        const atomicAsyncContext2Operations = atomicAsyncContextToOperations2[1];

        let violatingAsyncContextWriteOnContent = false;
        for (const operation of violatingAsyncContextOperations)
        {
            assert.ok(operation instanceof FileOperation);
            if (operation.getOperationOn() === 'content')
            {
                violatingAsyncContextWriteOnContent = true;
                break;
            }
        }

        let atomicAsyncContext2WriteOnContent = false;
        for (const operation of atomicAsyncContext2Operations)
        {
            assert.ok(operation instanceof FileOperation);
            if (operation.getOperationOn() === 'content')
            {
                atomicAsyncContext2WriteOnContent = true;
                break;
            }
        }

        return !(
            violatingAsyncContextWriteOnContent // violator writes on content
            && !atomicAsyncContext2WriteOnContent   // atomic2 writes on stat
        );
    }

    /**
     * In some apis (e.g. fs), we log operations on resolve of promises (using .finally())
     * which do not violates operations done in user code. So filter them out.
     * */
    private static isPromiseViolationTP(violationInfo: ViolationInfo): boolean
    {
        const {
            violatingAsyncContextToOperations: [violatingAsyncContext],
            atomicAsyncContextToOperations2: [operations2AsyncContext],
        } = violationInfo;
        if (violatingAsyncContext.asyncType === 'PROMISE' && operations2AsyncContext.asyncType === 'PROMISE')
        {
            return !(violatingAsyncContext.codeInfo === null    // violator is located in analysis code
                && operations2AsyncContext.codeInfo !== null    // operation2 is located in user code
            );
        }
        else
        {
            return true;
        }
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
}