import Song from "../interfaces/Song";
import { PhoneticModeSetting } from "../store/SettingEnums";
import { getPhonetic } from "./phonetic";
import { SongEntry } from "./types";

function makeSortable(order: string) {
    const ap = Array.prototype;

    // mapping from character -> precedence
    const orderMap = {} as { [id: string]: number };
    // let max = order.length + 2;
    ap.forEach.call(order, function (char, idx) {
        orderMap[char] = idx + 1;
    });

    const cache = {} as { [id: string]: string };

    return function sortable(s: string): string {
        if (s in cache) {
            return cache[s];
        }
        const result = s.toLowerCase()
            .replace(/-/g, ' ')
            .split('')
            .map(c => (c in orderMap) ? String.fromCharCode(orderMap[c]) : '')
            .join('');
        cache[s] = result;
        return result;
    }
}

// Merged alphabets with order of precedence:
// Diasporic Ukrainian, Rusyn, Belarusian, English, Polish, Slovak
// Not including punctuation so it gets ignored
// ы and ѣ grouped with modern replacements in Ukrainian
const sortable = makeSortable(
    ' абвгґдеёєжзиыіїѣйклмнопрстуўфхцчшщэюяьъaąáäbcćčdďeęéfghiíjklłĺľmnńňoóôpqrŕsśštťuúvwxyýzźżž0123456789'
);

export default function getSortedSongsAndRedirects(
    songs: Song[],
    phonetic: PhoneticModeSetting,
): SongEntry[] {
    const result = [] as SongEntry[];

    // Necessary in case multiple titles transliterate to the same thing
    const usedTitles = new Set<string>();

    songs.forEach(song => {
        // Add main title
        const title = getPhonetic(phonetic, song.init.name)
        const searchTitle = _searchTitle(song.init.name);
        if (!usedTitles.has(title)) {
            result.push({
                title,
                searchTitle,
                song,
                isRedirect: false,
            } as SongEntry);
            usedTitles.add(title);
        }
        // Add alternate titles
        song.init.alternateNames?.forEach(altName => {
            const altTitle = getPhonetic(phonetic, altName);
            if (!usedTitles.has(altTitle)) {
                const searchTitle = _searchTitle(altName);
                result.push({
                    title: altTitle,
                    searchTitle,
                    song,
                    isRedirect: true,
                });
                usedTitles.add(altTitle);
            }
        });
    });
    return result.sort((a, b) => {
        const aS = sortable(a.title);
        const bS = sortable(b.title);
        if (aS < bS) {
            return -1;
        } else if (aS > bS) {
            return 1;
        }
        // If equal, fallback on comparing the regular strings
        return a < b ? -1 : (a > b ? 1 : 0);
    });
}

function _searchTitle(name: string) {
    return name + ' ' + getPhonetic(PhoneticModeSetting.STANDARD, name);
}