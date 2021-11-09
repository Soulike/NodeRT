import {ResourceDeclaration} from '../../LogStore/Class/ResourceDeclaration';
import {RaceConditionInfo} from './RaceConditionInfo';
import assert from 'assert';
import objectHash from 'object-hash';

export class Filter
{
    private static readonly reportedRaceCondition = new Map<ResourceDeclaration, Set<string>>();

    public static isTruePositive(_raceConditionInfo: RaceConditionInfo): boolean
    {
        return true;
    }

    /**
     * Check if the RaceConditionInfo has been reported
     */
    public static hasReported(resourceDeclaration: ResourceDeclaration, raceConditionInfo: RaceConditionInfo): boolean
    {
        const hashes = Filter.reportedRaceCondition.get(resourceDeclaration);
        if (hashes === undefined)
        {
            return false;
        }
        const hash = Filter.getRaceConditionInfoHash(raceConditionInfo);
        if (hash === null)
        {
            return false;
        }
        else
        {
            return hashes.has(hash);
        }
    }

    public static addReported(resourceDeclaration: ResourceDeclaration, raceConditionInfo: RaceConditionInfo): void
    {
        let hashes = Filter.reportedRaceCondition.get(resourceDeclaration) ?? new Set();
        const hash = Filter.getRaceConditionInfoHash(raceConditionInfo);
        if (hash !== null)
        {
            hashes.add(hash);
        }
        Filter.reportedRaceCondition.set(resourceDeclaration, hashes);
    }

    /**
     * Calculate an unique hash for a ViolationInfo
     * if any of the callbacks is invoked by C++ modules, which is not able to be hashed, returns null
     */
    private static getRaceConditionInfoHash(raceConditionInfo: RaceConditionInfo): string | null
    {
        const {
            asyncContentToOperations1, asyncContentToOperations2,
        } = raceConditionInfo;

        const [asyncCalledFunction1, asyncCalledFunction2] = [
            asyncContentToOperations1[0].functionWeakRef,
            asyncContentToOperations2[0].functionWeakRef,
        ];
        assert.ok(asyncCalledFunction2 !== null);

        const callbackFunction1Ref = asyncCalledFunction1 === null ? null : asyncCalledFunction1.deref;
        const callbackFunction2Ref = asyncCalledFunction2.deref;

        assert.ok(callbackFunction1Ref !== undefined);
        assert.ok(callbackFunction2Ref !== undefined);

        return [
            objectHash.MD5(callbackFunction1Ref),
            objectHash.MD5(callbackFunction2Ref),
        ].join(',');
    }
}