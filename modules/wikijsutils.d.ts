// Give typescript access to all the functions in wikijs/dist/util
// https://github.com/dijs/wiki
declare module 'wikijs/dist/util' {
    export function api(apiOptions, params = {})
    export function pagination(apiOptions, params, parseResults)
    export function aggregatePagination(pagination, previousResults = [])
    export function aggregate(apiOptions, params, list, key, prefix, results = [])
    export function parseContent(source)
}

declare module 'wikijs' {
    interface Page {
        rawInfo(title?: string | null | undefined);
    }
}