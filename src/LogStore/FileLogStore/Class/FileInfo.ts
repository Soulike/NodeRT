import { ResourceInfo } from '../../Class/ResourceInfo';
import { SourceCodeInfo } from '../../Class/SourceCodeInfo';
import { StatisticsStore } from '../../StatisticsStore';

export class FileInfo extends ResourceInfo
{
    private readonly filePath: string;

    constructor(filePath: string, possibleDefineCodeScope: SourceCodeInfo|null)
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