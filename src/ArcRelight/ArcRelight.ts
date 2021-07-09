import {ContentRating, SourceInfo} from 'paperback-extensions-common'
import {MangAdventure} from '../MangAdventure'
import {ISeries} from '../Interfaces'

/** Arc-Relight metadata. */
export const ArcRelightInfo: SourceInfo = {
    name: 'Arc-Relight',
    icon: 'icon.png',
    version: MangAdventure.version,
    description: 'Extension for arc-relight.com',
    websiteBaseURL: 'https://arc-relight.com',
    contentRating: ContentRating.EVERYONE,
    author: 'ObserverOfTime',
}

/** Arc-Relight source class. */
export class ArcRelight extends MangAdventure {
    /** @inheritDoc */
    protected readonly baseUrl: string = ArcRelightInfo.websiteBaseURL

    /** @inheritDoc */
    protected override isHentai = (series: ISeries): boolean => false
}
