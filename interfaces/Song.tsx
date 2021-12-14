export default class Song {
    // These are params which should not be updated from the web
    // but instead come from local changes

    public local: {
        transposition: number,
        columns: number,
    }

    constructor(
        public init: {
            name: string,
            alternateNames: string[],
        },
        public populated: {
            populatedTime: number,
            wikitext: string,
            categories: string[],
        } | null,
        // Pass in null to use the defaults
        localIn: {
            transposition: number,
            columns: number,
        } | null,
    ) {
        this.local = localIn ?? {
            transposition: 0,
            columns: 1,
        }
    }

    // This file cannot have any helper functions because redux persist
    // will not include them when rehydrating
    // Use SongWrapper instead for this
}
