import {ResourceInfo} from '../../Class/ResourceInfo';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';
import {StatisticsStore} from '../../StatisticsStore';
import {isRunningUnitTests} from '../../../Util';

export class FileInfo extends ResourceInfo
{
    private readonly filePath: string;

    constructor(filePath: string, possibleDefineCodeScope: SourceCodeInfo | null)
    {
        super('file', possibleDefineCodeScope);
        this.filePath = filePath;
        StatisticsStore.addFileCount();
    }

    public override getHash(): string
    {
        if (isRunningUnitTests())
        {
            return JSON.stringify({
                ...this,
                filePath: undefined,
            });
        }
        else
        {
            return JSON.stringify(this);
        }
    }

    public is(filePath: string): boolean
    {
        return this.filePath === filePath;
    }
}