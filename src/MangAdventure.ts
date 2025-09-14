import type {
    Chapter,
    ChapterDetails,
    ChapterProviding,
    HomePageSectionsProviding,
    HomeSection,
    MangaProviding,
    // MangaUpdates,
    PagedResults,
    PartialSourceManga,
    Response,
    SearchRequest,
    SearchResultsProviding,
    SourceManga,
    TagSection,
} from '@paperback/types'
import type {
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
export abstract class MangAdventure implements
    ChapterProviding, HomePageSectionsProviding, MangaProviding, SearchResultsProviding {
    /** The base URL of the website. */
    protected abstract readonly baseUrl: string

    /** The version of the extension. */
    protected abstract readonly version: string

    /** The language code of the website. */
    protected readonly langCode: string = 'gb'

    /** A list of `mangaIds` that correspond to long-strip series. */
    protected readonly longStripIds: string[] = []

    /** The cached categories of the source. */
    private categories?: TagSection

    /** The URL of the website's API. */
    private get apiUrl(): string { return `${this.baseUrl}/api/v2` }

    /** The headers used in the requests. */
    private get headers(): Record<string, string> {
        return { 'user-agent': `Mozilla/5.0 (iPhone; like Mac OS X) Paperback-iOS/${this.version}` }
    }

    readonly requestManager = App.createRequestManager({ requestsPerSecond: 6 })

    /**
     * Determines whether the given series is a Hentai.
     *
     * @param series The series to be checked.
     */
    protected isHentai = (series: ISeries): boolean =>
        series.categories?.includes('Hentai') ?? false

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = App.createRequest({
            url: `${this.apiUrl}/chapters/${chapterId}/pages?track=true`,
            headers: this.headers, method
        })
        const res = await this.requestManager.schedule(request, 1)
        const data = this.parseResponse<IResults<IPage>>(res)
        return App.createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            pages: data.results.map(page => page.image),
        })
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = App.createRequest({
            url: `${this.apiUrl}/series/${mangaId}/chapters`,
            headers: this.headers, method
        })
        const res = await this.requestManager.schedule(request, 1)
        const data = this.parseResponse<IResults<IChapter>>(res)
        return data.results.map(chapter => App.createChapter({
            id: chapter.id.toString(),
            chapNum: chapter.number,
            volume: chapter.volume || undefined,
            name: chapter.full_title + (chapter.final ? ' [END]' : ''),
            time: new Date(chapter.published),
            group: chapter.groups.join(', '),
            langCode: this.langCode
        }))
    }

    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        const request = App.createRequest({
            url: `${this.apiUrl}/series/${mangaId}`,
            headers: this.headers, method
        })
        const res = await this.requestManager.schedule(request, 1)
        const data = this.parseResponse<ISeries>(res)
        const mangaInfo = App.createMangaInfo({
            image: data.cover,
            desc: data.description ?? '',
            titles: [data.title, ...(data.aliases ?? [])],
            hentai: this.isHentai(data),
            status: this.getStatus(data),
        })
        if (data.artists) {
            mangaInfo.artist = data.artists.join(', ')
        }
        if (data.authors) {
            mangaInfo.author = data.authors.join(', ')
        }
        if (data.categories) {
            mangaInfo.tags = [
                App.createTagSection({
                    id: 'categories',
                    label: 'Categories',
                    tags: data.categories.map(
                        id => App.createTag({ id, label: id })
                    )
                })
            ]
        }
        mangaInfo.views = data.views ?? 0
        return App.createSourceManga({ id: data.slug, mangaInfo })
    }

    getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        const search: any = { title: query.title ?? '', categories: [] }
        query.includedTags?.forEach(t => search.categories.push(t.id))
        query.excludedTags?.forEach(t => search.categories.push('-' + t.id))
        return this.getWebsiteMangaDirectory({ ...metadata, search })
    }

    /* XXX: removed upstream?
    async filterUpdatedManga(
        mangaUpdatesFoundCallback: (updates: MangaUpdates) => void,
        time: Date, ids: string[]
    ): Promise<void> {
        const request = App.createRequest({
            url: `${this.apiUrl}/series`,
            headers: this.headers, method
        })
        await this.requestManager.schedule(request, 1)
            .then(res => this.parseResponse<IPaginator<ISeries>>(res))
            .then(data => mangaUpdatesFoundCallback(
                App.createMangaUpdates({
                    ids: data.results.filter(s =>
                        new Date(s.updated) >= time && ids.includes(s.slug)
                    ).map(s => s.slug)
                })
            ))
    }
    */

    async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        const sections = [
            App.createHomeSection({
                id: 'title',
                title: 'All Series',
                containsMoreItems: true,
                type: 'singleRowNormal',
            }),
            App.createHomeSection({
                id: '-views',
                title: 'Most Viewed',
                containsMoreItems: true,
                type: 'singleRowNormal',
            }),
            App.createHomeSection({
                id: '-latest_upload',
                title: 'Latest Updates',
                containsMoreItems: true,
                type: 'singleRowNormal',
            })
        ]
        const promises = sections.map(async section => {
            sectionCallback(section)
            const request = App.createRequest({
                url: `${this.apiUrl}/series?sort=${section.id}`,
                headers: this.headers, method
            })
            const res = await this.requestManager.schedule(request, 1)
            const data = this.parseResponse<IPaginator<ISeries>>(res)
            section.items = data.results.map(this.toPartial)
            return sectionCallback(section)
        })
        await Promise.all(promises)
    }

    getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        return this.getWebsiteMangaDirectory({ ...metadata, sort: homepageSectionId })
    }

    async getWebsiteMangaDirectory(metadata: any): Promise<PagedResults> {
        if (metadata?.last === true)
            return Promise.resolve(App.createPagedResults({ results: [] }))
        const page: number = (metadata?.page ?? 0) + 1
        const params = new URLSearchParams({
            ...metadata?.search,
            page: page.toString(),
            sort: metadata?.sort ?? 'title',
        })
        const request = App.createRequest({
            url: `${this.apiUrl}/series?${params}`,
            headers: this.headers, method
        })
        const res = await this.requestManager.schedule(request, 1)
        const data = this.parseResponse<IPaginator<ISeries>>(res)
        return App.createPagedResults({
            results: data.results.map(this.toPartial),
            metadata: { page, last: data.last }
        })
    }

    async getSearchTags(): Promise<TagSection[]> {
        if (this.categories) return [this.categories]
        const request = App.createRequest({
            url: `${this.apiUrl}/categories`,
            headers: this.headers, method
        })
        const res = await this.requestManager.schedule(request, 1)
        const data = this.parseResponse<IResults<ICategory>>(res)
        this.categories = App.createTagSection({
            id: 'categories',
            label: 'Categories',
            tags: data.results.map(c => App.createTag({
                id: c.name, label: c.name
            }))
        })
        return [this.categories]
    }

    getMangaShareUrl = (mangaId: string): string => `${this.baseUrl}/reader/${mangaId}/`

    supportsSearchOperators = async (): Promise<boolean> => false

    supportsTagExclusion = async (): Promise<boolean> => true

    /** Returns the status of the given series. */
    private getStatus(series: ISeries): string {
        if (series.licensed) return 'Licensed'
        if (!series.status) return 'Unknown'
        return series.status.charAt(0).toUpperCase() + series.status.slice(1)
    }

    /** Converts the given series to a tile. */
    private toPartial = (series: ISeries): PartialSourceManga =>
        App.createPartialSourceManga({
            mangaId: series.slug,
            image: series.cover,
            title: series.title,
            subtitle: series.chapters === null ? '[LICENSED]' : undefined,
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
        return JSON.parse(response.data ?? '')
    }
}
