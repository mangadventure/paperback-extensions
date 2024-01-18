import {
    ContentRating,
    SourceInfo,
    TagType
} from 'paperback-extensions-common'
import {MangAdventure} from '../MangAdventure'
import {ISeries} from '../Interfaces'

/** Arc-Relight metadata. */
export const ArcRelightInfo: SourceInfo = {
    name: 'Arc-Relight',
    icon: 'icon.png',
    version: '0.4.0',
    description: 'Extension for arc-relight.com',
    websiteBaseURL: 'https://arc-relight.com',
    contentRating: ContentRating.EVERYONE,
    author: 'MangAdventure',
    authorWebsite: 'https://github.com/mangadventure',
    sourceTags: [{text: 'Notifications', type: TagType.GREEN}]
}

/** Arc-Relight source class. */
export class ArcRelight extends MangAdventure {
    /** @inheritDoc */
    protected readonly baseUrl: string = ArcRelightInfo.websiteBaseURL

    /** @inheritDoc */
    protected readonly version: string = ArcRelightInfo.version

    /** @inheritDoc */
    protected override isHentai = (_series: ISeries): boolean => false
}
