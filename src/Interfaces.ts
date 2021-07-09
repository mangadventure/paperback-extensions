/** Generic results wrapper schema. */
export interface IResults<T> {
    results: T[]
}

/** Generic paginator schema. */
export interface IPaginator<T> {
    total: number
    last: boolean
    results: T[]
}

/** Category model schema. */
export interface ICategory {
    name: string
    description: string
}

/** Page model schema. */
export interface IPage {
    id: number
    image: string
    number: number
    url: string
}

/** Chapter model schema. */
export interface IChapter {
    id: number
    title: string
    number: number
    volume: number
    published: string
    final: boolean
    series: string
    groups: string[]
    full_title: string
    url: string
}

/** Series model schema. */
export interface ISeries {
    slug: string
    title: string
    url: string
    cover: string
    description?: string
    completed?: boolean
    authors?: string[]
    artists?: string[]
    categories?: string[]
}
