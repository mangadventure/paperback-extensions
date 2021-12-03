import {
    ContentRating,
    SourceInfo,
    TagType
} from 'paperback-extensions-common'
import {MangAdventure} from '../MangAdventure'

/** Assorted Scans metadata. */
export const AssortedScansInfo: SourceInfo = {
    name: 'Assorted Scans',
    icon: 'icon.png',
    version: '0.3.0',
    description: 'Extension for assortedscans.com',
    websiteBaseURL: 'https://assortedscans.com',
    contentRating: ContentRating.MATURE,
    author: 'MangAdventure',
    authorWebsite: 'https://github.com/mangadventure',
    sourceTags: [{text: 'Notifications', type: TagType.GREEN}]
}

/** Assorted Scans source class. */
export class AssortedScans extends MangAdventure {
    /** @inheritDoc */
    protected readonly baseUrl: string = AssortedScansInfo.websiteBaseURL

    /** @inheritDoc */
    protected readonly version: string = AssortedScansInfo.version

    /** @inheritDoc */
    protected override readonly longStripIds = [
        'creepy-cat',
        'mad-webcomic',
        'mousou-telepathy',
        'please-take-my-brother-away',
        'three-video-messages',
    ]
}
