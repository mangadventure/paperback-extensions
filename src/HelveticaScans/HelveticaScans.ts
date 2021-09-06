import {ContentRating, SourceInfo} from 'paperback-extensions-common'
import {MangAdventure} from '../MangAdventure'

/** Helvetica Scans metadata. */
export const HelveticaScansInfo: SourceInfo = {
    name: 'Helvetica Scans',
    icon: 'icon.png',
    version: '0.2.1',
    description: 'Extension for helveticascans.com',
    websiteBaseURL: 'https://helveticascans.com',
    contentRating: ContentRating.MATURE,
    author: 'MangAdventure',
    authorWebsite: 'https://github.com/mangadventure'
}

/** Helvetica Scans source class. */
export class HelveticaScans extends MangAdventure {
    /** @inheritDoc */
    protected readonly baseUrl: string = HelveticaScansInfo.websiteBaseURL

    /** @inheritDoc */
    protected readonly version: string = HelveticaScansInfo.version

    /** @inheritDoc */
    protected override readonly longStripIds = [
        'creepy-cat',
        'mad-webcomic',
        'mousou-telepathy',
        'please-take-my-brother-away',
        'three-video-messages',
    ]
}
