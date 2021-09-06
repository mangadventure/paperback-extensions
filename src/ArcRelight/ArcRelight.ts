import {ContentRating, SourceInfo} from 'paperback-extensions-common'
import {MangAdventure} from '../MangAdventure'
import {ISeries} from '../Interfaces'

/** Arc-Relight metadata. */
export const ArcRelightInfo: SourceInfo = {
    name: 'Arc-Relight',
    icon: 'icon.png',
    version: '0.2.0',
    description: 'Extension for arc-relight.com',
    websiteBaseURL: 'https://arc-relight.com',
    contentRating: ContentRating.EVERYONE,
    author: 'MangAdventure',
    authorWebsite: 'https://github.com/mangadventure'
}

/** Arc-Relight source class. */
export class ArcRelight extends MangAdventure {
    /** @inheritDoc */
    protected readonly baseUrl: string = ArcRelightInfo.websiteBaseURL

    /** @inheritDoc */
    protected readonly version: string = ArcRelightInfo.version

    /** @inheritDoc */
    protected override isHentai = (series: ISeries): boolean => false
}
