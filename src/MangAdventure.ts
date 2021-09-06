import {
    Chapter,
    ChapterDetails,
    HomeSection,
    LanguageCode,
    Manga,
    MangaStatus,
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
    getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const [series, volume, number] = chapterId.split('/').slice(2, 5)
        const params = new URLSearchParams(
            <Record<string, string>>{series, volume, number}
        )
        const request = createRequestObject({
            url: `${this.apiUrl}/pages?${params}`,
            headers: this.headers, method
        })
        return this.requestManager.schedule(request, 1)
            .then(res => this.parseResponse<IResults<IPage>>(res))
            .then(data => createChapterDetails({
                id: chapterId,
                mangaId: mangaId,
                longStrip: this.longStripIds.includes(mangaId),
                pages: data.results.map(page => page.image)
            }))
    }

    /** @inheritDoc */
    getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: `${this.apiUrl}/chapters?series=${mangaId}`,
            headers: this.headers, method
        })
        return this.requestManager.schedule(request, 1)
            .then(res => this.parseResponse<IResults<IChapter>>(res))
            .then(data => data.results.map(chapter => createChapter({
                id: chapter.url,
                mangaId: chapter.series,
                chapNum: chapter.number,
                volume: chapter.volume || undefined,
                name: chapter.full_title + (chapter.final ? ' [END]' : ''),
                time: new Date(chapter.published),
                group: chapter.groups.join(', '),
                langCode: this.languageCode
            })))
    }

    /** @inheritDoc */
    getMangaDetails(mangaId: string): Promise<Manga> {
        const request = createRequestObject({
            url: `${this.apiUrl}/series/${mangaId}`,
            headers: this.headers, method
        })
        return this.requestManager.schedule(request, 1)
            .then(res => this.parseResponse<ISeries>(res))
            .then(data => createManga({
                id: data.slug,
                image: data.cover,
                titles: [data.title],
                desc: data.description,
                artist: data.artists?.join(', '),
                author: data.authors?.join(', '),
                hentai: this.isHentai(data),
                status: data.completed! ? MangaStatus.COMPLETED : MangaStatus.ONGOING,
                tags: data.categories ? [createTagSection({
                    id: 'categories',
                    label: 'Categories',
                    tags: data.categories.map(
                        id => createTag({id, label: id})
                    )
                })] : [],
                rating: 0
            }))
    }

    /** @inheritDoc */
    getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        const search: any = {title: query.title ?? '', categories: []}
        query.includedTags?.forEach(t => search.categories.push(t.id))
        query.excludedTags?.forEach(t => search.categories.push('-' + t.id))
        return this.getWebsiteMangaDirectory({...metadata, search})
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
                id: '-latest_upload',
                title: 'Latest Updates',
                view_more: true
            })
        ]
        const promises = sections.map(s => {
            sectionCallback(s)
            const request = createRequestObject({
                url: `${this.apiUrl}/series?sort=${s.id}`,
                headers: this.headers, method
            })
            return this.requestManager.schedule(request, 1)
                .then(res => this.parseResponse<IPaginator<ISeries>>(res))
                .then(data => {
                    s.items = data.results.map(series => createMangaTile({
                        id: series.slug,
                        image: series.cover,
                        title: createIconText({text: series.title})
                    }))
                    return sectionCallback(s)
                })
        })
        await Promise.all(promises)
    }

    /** @inheritDoc */
    override getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        return this.getWebsiteMangaDirectory({...metadata, sort: homepageSectionId})
    }

    /** @inheritDoc */
    override getWebsiteMangaDirectory(metadata: any): Promise<PagedResults> {
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
        return this.requestManager.schedule(request, 1)
            .then(res => this.parseResponse<IPaginator<ISeries>>(res))
            .then(data => createPagedResults({
                results: data.results.map(series => createMangaTile({
                    id: series.slug,
                    image: series.cover,
                    title: createIconText({text: series.title})
                })),
                metadata: {page, last: data.last}
            }))
    }

    /** @inheritDoc */
    override getSearchTags(): Promise<TagSection[]> {
        if (this.categories) return Promise.resolve([this.categories])
        const request = createRequestObject({
            url: `${this.apiUrl}/categories`,
            headers: this.headers, method
        })
        return this.requestManager.schedule(request, 1)
            .then(res => this.parseResponse<IResults<ICategory>>(res))
            .then(data => {
                this.categories = createTagSection({
                    id: 'categories',
                    label: 'Categories',
                    tags: data.results.map(c => createTag({
                        id: c.name, label: c.name
                    }))
                })
                return [this.categories]
            })
    }

    /** @inheritDoc */
    override getMangaShareUrl = (mangaId: string): string => `${this.baseUrl}/reader/${mangaId}/`

    /** @inheritDoc */
    override supportsSearchOperators = async (): Promise<boolean> => false

    /** @inheritDoc */
    override supportsTagExclusion = async (): Promise<boolean> => true

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
