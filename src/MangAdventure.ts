import {
    Chapter,
    ChapterDetails,
    HomeSection,
    LanguageCode,
    Manga,
    MangaStatus,
    MangaTile,
    MangaUpdates,
    PagedResults,
    RequestHeaders,
    Response,
    SearchRequest,
    Source,
    TagSection,
} from 'paperback-extensions-common'
import {
    ICategory,
    IChapter,
    IPage,
    IPaginator,
    IResults,
    ISeries,
} from './Interfaces'
import URLSearchParams from '@ungap/url-search-params'

/** The HTTP method used in the API. */
const method = 'GET'

/** Base class for the MangAdventure framework. */
export abstract class MangAdventure extends Source {
    /** The base URL of the website. */
    protected abstract readonly baseUrl: string

    /** The version of the extension. */
    protected abstract readonly version: string

    /** The language code of the website. */
    protected readonly languageCode = LanguageCode.ENGLISH

    /** A list of `mangaIds` that correspond to long-strip series. */
    protected readonly longStripIds: string[] = []

    /** The cached categories of the source. */
    private categories?: TagSection

    /** The URL of the website's API. */
    private get apiUrl(): string { return `${this.baseUrl}/api/v2` }

    /** The headers used in the requests. */
    private get headers(): RequestHeaders {
        return {'user-agent': `Mozilla 5.0 (Paperback-iOS ${this.version}; Mobile)`}
    }

    /** @inheritDoc */
    override readonly requestManager = createRequestManager({requestsPerSecond: 6})

    /**
     * Determines whether the given series is a Hentai.
     *
     * @param series The series to be checked.
     */
    protected isHentai = (series: ISeries): boolean =>
        series.categories?.includes('Hentai') ?? false

    /** @inheritDoc */
    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const [slug, vol, num] = chapterId.split('/').slice(2, 5)
        const params = new URLSearchParams(
            {series: slug!, volume: vol!, number: num!, track: 'true'}
        )
        const request = createRequestObject({
            url: `${this.apiUrl}/pages?${params}`,
            headers: this.headers, method
        })
        const res = await this.requestManager.schedule(request, 1)
        const data = this.parseResponse<IResults<IPage>>(res)
        return createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            longStrip: this.longStripIds.includes(mangaId),
            pages: data.results.map(page => page.image)
        })
    }

    /** @inheritDoc */
    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: `${this.apiUrl}/chapters?series=${mangaId}`,
            headers: this.headers, method
        })
        const res = await this.requestManager.schedule(request, 1)
        const data = this.parseResponse<IResults<IChapter>>(res)
        return data.results.map(chapter => createChapter({
            id: chapter.url,
            mangaId: chapter.series,
            chapNum: chapter.number,
            volume: chapter.volume || undefined,
            name: chapter.full_title + (chapter.final ? ' [END]' : ''),
            time: new Date(chapter.published),
            group: chapter.groups.join(', '),
            langCode: this.languageCode
        }))
    }

    /** @inheritDoc */
    async getMangaDetails(mangaId: string): Promise<Manga> {
        const request = createRequestObject({
            url: `${this.apiUrl}/series/${mangaId}`,
            headers: this.headers, method
        })
        const res = await this.requestManager.schedule(request, 1)
        const data = this.parseResponse<ISeries>(res)
        return createManga({
            id: data.slug,
            image: data.cover,
            titles: [data.title, ...data.aliases!],
            desc: data.description,
            artist: data.artists?.join(', '),
            author: data.authors?.join(', '),
            hentai: this.isHentai(data),
            status: this.getStatus(data),
            lastUpdate: new Date(data.updated),
            tags: data.categories ? [createTagSection({
                id: 'categories',
                label: 'Categories',
                tags: data.categories.map(
                    id => createTag({id, label: id})
                )
            })] : [],
            views: data.views!,
            rating: 0
        })
    }

    /** @inheritDoc */
    getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        const search: any = {title: query.title ?? '', categories: []}
        query.includedTags?.forEach(t => search.categories.push(t.id))
        query.excludedTags?.forEach(t => search.categories.push('-' + t.id))
        return this.getWebsiteMangaDirectory({...metadata, search})
    }

    /** @inheritDoc */
    override async filterUpdatedManga(
        mangaUpdatesFoundCallback: (updates: MangaUpdates) => void,
        time: Date, ids: string[]
    ): Promise<void> {
        const request = createRequestObject({
            url: `${this.apiUrl}/series`,
            headers: this.headers, method
        })
        await this.requestManager.schedule(request, 1)
            .then(res => this.parseResponse<IPaginator<ISeries>>(res))
            .then(data => mangaUpdatesFoundCallback(
                createMangaUpdates({
                    ids: data.results.filter(s =>
                        new Date(s.updated) >= time && ids.includes(s.slug)
                    ).map(s => s.slug)
                })
            ))
    }

    /** @inheritDoc */
    override async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        const sections = [
            createHomeSection({
                id: 'title',
                title: 'All Series',
                view_more: true
            }),
            createHomeSection({
                id: '-views',
                title: 'Most Viewed',
                view_more: true
            }),
            createHomeSection({
                id: '-latest_upload',
                title: 'Latest Updates',
                view_more: true
            })
        ]
        const promises = sections.map(async section => {
            sectionCallback(section)
            const request = createRequestObject({
                url: `${this.apiUrl}/series?sort=${section.id}`,
                headers: this.headers, method
            })
            const res = await this.requestManager.schedule(request, 1)
            const data = this.parseResponse<IPaginator<ISeries>>(res)
            section.items = data.results.map(this.toTile)
            return sectionCallback(section)
        })
        await Promise.all(promises)
    }

    /** @inheritDoc */
    override getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        return this.getWebsiteMangaDirectory({...metadata, sort: homepageSectionId})
    }

    /** @inheritDoc */
    override async getWebsiteMangaDirectory(metadata: any): Promise<PagedResults> {
        if (metadata?.last === true)
            return Promise.resolve(createPagedResults({results: []}))
        const page: number = (metadata?.page ?? 0) + 1
        const params = new URLSearchParams({
            ...metadata?.search,
            page: page.toString(),
            sort: metadata?.sort ?? 'title',
        })
        const request = createRequestObject({
            url: `${this.apiUrl}/series?${params}`,
            headers: this.headers, method
        })
        const res = await this.requestManager.schedule(request, 1)
        const data = this.parseResponse<IPaginator<ISeries>>(res)
        return createPagedResults({
            results: data.results.map(this.toTile),
            metadata: {page, last: data.last}
        })
    }

    /** @inheritDoc */
    override async getSearchTags(): Promise<TagSection[]> {
        if (this.categories) return [this.categories]
        const request = createRequestObject({
            url: `${this.apiUrl}/categories`,
            headers: this.headers, method
        })
        const res = await this.requestManager.schedule(request, 1)
        const data = this.parseResponse<IResults<ICategory>>(res)
        this.categories = createTagSection({
            id: 'categories',
            label: 'Categories',
            tags: data.results.map(c => createTag({
                id: c.name, label: c.name
            }))
        })
        return [this.categories]
    }

    /** @inheritDoc */
    override getMangaShareUrl = (mangaId: string): string => `${this.baseUrl}/reader/${mangaId}/`

    /** @inheritDoc */
    override supportsSearchOperators = async (): Promise<boolean> => false

    /** @inheritDoc */
    override supportsTagExclusion = async (): Promise<boolean> => true

    /** Returns the status of the given series. */
    private getStatus = (series: ISeries): MangaStatus =>
        series.licensed ? MangaStatus.ABANDONED : // closest status to licensed
            series.completed! ? MangaStatus.COMPLETED : MangaStatus.ONGOING

    /** Converts the given series to a tile. */
    private toTile = (series: ISeries) : MangaTile => createMangaTile({
        id: series.slug,
        image: series.cover,
        badge: series.chapters ?? undefined,
        title: createIconText({text: series.title}),
        secondaryText: series.chapters === null ?
            createIconText({text: '[LICENSED]'}) : undefined,
    })

    /**
     * Parses the given response into an object of type `T`.
     *
     * @template T - The type of the response data.
     * @param response - The response to be parsed.
     * @throws `Error` if the response cannot be parsed.
     */
    private parseResponse<T>(response: Response): T {
        if (response.status !== 200)
            throw new Error(`HTTP error ${response.status}: ${response.data}`)
        return JSON.parse(response.data)
    }
}
