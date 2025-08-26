type LocalSongData = {
    transposition: number;
    columns: number;
    favorite: boolean;
};

export default class Song {
    // These are params which should not be updated from the web
    // but instead come from local changes
    public local: LocalSongData;

    constructor (
        public init: {
            name: string;
            alternateNames: string[];
        },
        public populated: {
            populatedTime: number;
            wikitext: string;
            categories: string[];
            forceRefresh?: number;
        } | null,
        // Pass in null to use the defaults
        localIn: LocalSongData | null,
    ) {
        this.local = localIn ?? {
            transposition: 0,
            columns: 1,
            favorite: false,
        };
    }

    // This file cannot have any helper functions because redux persist
    // will not include them when rehydrating
    // Use SongWrapper instead for this
}
