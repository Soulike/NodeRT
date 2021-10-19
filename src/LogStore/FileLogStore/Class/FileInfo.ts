import {ResourceInfo} from '../../Class/ResourceInfo';
import {StatisticsStore} from '../../StatisticsStore';

export class FileInfo extends ResourceInfo
{
    private readonly filePath: string;

    constructor(filePath: string)
    {
        super('file');
        this.filePath = filePath;
        StatisticsStore.addFileCount();
    }

    public is(filePath: string): boolean
    {
        return this.filePath === filePath;
    }
}