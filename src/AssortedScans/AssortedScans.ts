import {SourceInfo} from 'paperback-extensions-common'
import {MangAdventure} from '../MangAdventure'

/** Assorted Scans metadata. */
export const AssortedScansInfo: SourceInfo = {
    name: 'Assorted Scans',
    icon: 'icon.png',
    version: '0.1.9',
    description: 'Extension for assortedscans.com',
    websiteBaseURL: 'https://assortedscans.com',
    hentaiSource: false,
    author: 'MangAdventure',
    authorWebsite: 'https://github.com/mangadventure'
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
