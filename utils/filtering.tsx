import { FLQSListItem } from '../components/FlatListQuickScroll/FlatListQuickScroll';
import { PhoneticModeSetting } from '../store/SettingEnums';
import { getPhonetic } from './phonetic';
import { SongEntry } from './types';

export function getFilteredSongs (songEntries: SongEntry[], search: string | null): SongEntry[] {
    if (search === null || search.length === 0) {
        return songEntries;
    }
    const saniSearch = _sanitize(search);

    return songEntries.filter(s => {
        // TODO: This phonetic filtering is janky AF and we can definitely improve it
        const saniTitle = _sanitize(s.searchTitle);
        return saniTitle.includes(saniSearch);
    });
}

function _sanitize (str: string) {
    return (
        str
            // Replace apostrophes with nothing
            .replace(/'/g, '')
            // Replace unicode non-alphanumeric chars with spaces
            .replace(/[^\p{L}|\p{N}]+/gu, ' ')
            // Replace multiple spaces with single space
            .replace(/\s+/g, ' ')
            .toLowerCase()
            .trim()
    );
}

export function getHeaderedSongs (entries: SongEntry[]): FLQSListItem<any>[] {
    var headeredSongs = [] as FLQSListItem<any>[];
    var headers = [] as string[];
    entries.forEach((result, index) => {
        const first = result.title.charAt(0);
        if (!headers.includes(first)) {
            headers.push(first);
            headeredSongs.push({
                height: 35,
                isHeader: true,
                headerText: first,
                data: first,
                element_key: 'HEADER_' + first,
                modification_key: 'HEADER_' + first,
            } as FLQSListItem<string>);
        }
        headeredSongs.push({
            height: 60,
            isHeader: false,
            data: { result: result, index: index },
            // This should NOT change as a particular element changes
            element_key: 'SONG|' + result.title,
            // This needs to change if the song needs a re-render!!
            modification_key:
                'SONG|' +
                result.title +
                '|' +
                result.song.populated?.populatedTime +
                '|' +
                index +
                '|' +
                result.song.populated?.forceRefresh,
        });
    });
    return headeredSongs;
}
