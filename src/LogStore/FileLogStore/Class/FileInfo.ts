import {ResourceInfo} from '../../Class/ResourceInfo';
import {StatisticsStore} from '../../StatisticsStore';
import {SourceCodeInfo} from '../../Class/SourceCodeInfo';

export class FileInfo extends ResourceInfo
{
    private readonly filePath: string;

    constructor(filePath: string, possibleDefineCodeScope: SourceCodeInfo)
    {
        super('file', possibleDefineCodeScope);
        this.filePath = filePath;
        StatisticsStore.addFileCount();
    }

    public is(filePath: string): boolean
    {
        return this.filePath === filePath;
    }
}