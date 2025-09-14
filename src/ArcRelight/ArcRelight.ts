import {
    ContentRating,
    type SourceInfo,
    SourceIntents,
} from '@paperback/types'
import { type ISeries } from '../Interfaces'
import { MangAdventure } from '../MangAdventure'

/** Arc-Relight metadata. */
export const ArcRelightInfo: SourceInfo = {
    name: 'Arc-Relight',
    icon: 'icon.png',
    version: '0.5.0',
    description: 'Extension for arc-relight.com',
    websiteBaseURL: 'https://arc-relight.com',
    contentRating: ContentRating.EVERYONE,
    author: 'MangAdventure',
    authorWebsite: 'https://github.com/mangadventure',
    intents: SourceIntents.HOMEPAGE_SECTIONS | SourceIntents.MANGA_CHAPTERS,
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
