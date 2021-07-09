import {
    Chapter,
    ChapterDetails,
    HomeSection,
    LanguageCode,
    Manga,
    MangaStatus,
    PagedResults,
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

    /** The language code of the website. */
    protected readonly languageCode = LanguageCode.ENGLISH

    /** A list of `mangaIds` that correspond to long-strip series. */
    protected readonly longStripIds: string[] = []

    /** The cached categories of the source. */
    private categories?: TagSection

    /** The URL of the website's API. */
    protected get apiUrl(): string { return `${this.baseUrl}/api/v2` }

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
        const params = {series, volume, number} as Record<string, string>
        const request = createRequestObject({
            url: `${this.apiUrl}/pages?${new URLSearchParams(params)}`, method
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
            url: `${this.apiUrl}/chapters?series=${mangaId}`, method
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
            url: `${this.apiUrl}/series/${mangaId}`, method
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
    searchRequest(query: SearchRequest, metadata: any): Promise<PagedResults> {
        const page = (metadata?.page ?? 0) + 1
        const search = new URLSearchParams({'page': page.toString()})
        if (query.title) search.set('title', query.title)
        if (query.author) search.set('author', query.author)
        if (query.artist) search.set('artist', query.artist)
        if (query.status == MangaStatus.COMPLETED)
            search.set('status', 'completed')
        else if (query.status == MangaStatus.ONGOING)
            search.set('status', 'ongoing')
        let genres: string[] = []
        if (query.includeGenre) genres = genres.concat(query.includeGenre)
        if (query.excludeGenre) genres = genres.concat(query.excludeGenre.map(g => '-' + g))
        // if (query.hStatus !== undefined) genres.push((query.hStatus ? '' : '-') + 'Hentai')
        if (genres) search.set('categories', genres.join(','))
        const request = createRequestObject({
            url: `${this.apiUrl}/series?${search}`, method
        })
        return this.requestManager.schedule(request, 1)
            .then(res => this.parseResponse<IPaginator<ISeries>>(res))
            .then(data => data.last ? createPagedResults({results: []}) :
                createPagedResults({
                    results: data.results.map(series => createMangaTile({
                        id: series.slug,
                        image: series.cover,
                        title: createIconText({text: series.title})
                    })),
                    metadata: {page}
                }))
    }

    /** @inheritDoc */
    override getWebsiteMangaDirectory(metadata: any): Promise<PagedResults> {
        const page = (metadata?.page ?? 0) + 1
        const request = createRequestObject({
            url: `${this.apiUrl}/series?page=${page}`, method
        })
        return this.requestManager.schedule(request, 1)
            .then(res => this.parseResponse<IPaginator<ISeries>>(res))
            .then(data => data.last ? createPagedResults({results: []}) :
                createPagedResults({
                    results: data.results.map(series => createMangaTile({
                        id: series.slug,
                        image: series.cover,
                        title: createIconText({text: series.title})
                    })),
                    metadata: {page}
                }))
    }

    /** @inheritDoc */
    override async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        const section = createHomeSection({
            id: 'all',
            title: 'All Series',
            view_more: true
        })
        sectionCallback(section)
        const request = createRequestObject({
            url: `${this.apiUrl}/series`, method
        })
        const response = await this.requestManager.schedule(request, 1)
        const data: IPaginator<ISeries> = this.parseResponse(response)
        section.items = data.results.map(series => createMangaTile({
            id: series.slug,
            image: series.cover,
            title: createIconText({text: series.title})
        }))
        sectionCallback(section)
    }

    /** @inheritDoc */
    override getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        return this.getWebsiteMangaDirectory(metadata)
    }

    /** @inheritDoc */
    override async getTags(): Promise<TagSection[]> {
        if (this.categories) return [this.categories]
        const request = createRequestObject({
            url: `${this.apiUrl}/categories`, method
        })
        const response = await this.requestManager.schedule(request, 1)
        const data: IResults<ICategory> = this.parseResponse(response)
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

    /**
     * Parses the given response into an object of type `T`.
     *
     * @template T - The type of the response data.
     * @param response - The response to be parsed.
     * @throws `Error` if the response cannot be parsed.
     */
    private parseResponse<T>(response: Response): T {
        if (response.status != 200)
            throw new Error(`HTTP error ${response.status}: ${response.data}`)
        return JSON.parse(response.data)
    }

    /** The version of the extension. */
    static readonly version: string = '0.1.5'
}
