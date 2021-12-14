import { G } from "react-native-svg";
import { PhoneticModeSetting } from "../store/SettingEnums";
const replaceAll = require('string.prototype.replaceall');

const cache = {} as {
    [phonetic in PhoneticModeSetting]: {
        [translate: number]: {
            [source: string]: string
        }
    }
};

export function getPhonetic(
    setting: PhoneticModeSetting,
    s: string,
    translate?: boolean,
): string {
    if (setting === PhoneticModeSetting.OFF) {
        return s;
    }
    const translateInt = translate ? 1 : 0;
    if (!cache[setting]) {
        cache[setting] = {};
    }
    if (!cache[setting][translateInt]) {
        cache[setting][translateInt] = {};
    }
    if (cache[setting][translateInt][s]) {
        return cache[setting][translateInt][s];
    }
    if (translate) {
        s = getTranslations(s);
    }

    const result = (() => {
        switch (setting) {
            case PhoneticModeSetting.STANDARD:
                return getStandardPhonetic(s);
        }
    })()
    cache[setting][translateInt][s] = result;
    return result;
}

function getTranslations(s: string): string {
    // Remove "р." or "р" from the end of years 
    s = s.replace(/(\d{4})р\.?/g, function (match, ...args) {
        return args[0];
    });

    s = replaceWordsPreserveCase(s, "сумівські", "CYM");
    s = replaceWordsPreserveCase(s, "пісні", "songs");
    s = replaceWordsPreserveCase(s, "пластові", "Plast");
    s = replaceWordsPreserveCase(s, "дитячі", "children's");
    s = replaceWordsPreserveCase(s, "сумівські", "CYM");
    s = replaceWordsPreserveCase(s, "лемківські", "lemko");
    s = replaceWordsPreserveCase(s, "діяспора", "diaspora");
    s = replaceWordsPreserveCase(s, "таборові", "camp");
    s = replaceWordsPreserveCase(s, "кухонні", "cooking");
    s = replaceWordsPreserveCase(s, "релігійні", "religious");
    s = replaceWordsPreserveCase(s, "зимові", "winter");
    
    s = replaceWordsPreserveCase(s, "пласт", "Plast");
    s = replaceWordsPreserveCase(s, "пластовий", "Plast");
    s = replaceWordsPreserveCase(s, "пластова", "Plast");
    s = replaceWordsPreserveCase(s, "пластові", "Plast");
    s = replaceWordsPreserveCase(s, "пластунські", "Plast");
    s = replaceWordsPreserveCase(s, "сум", "CYM");
    s = replaceWordsPreserveCase(s, "сумівський", "CYM");
    s = replaceWordsPreserveCase(s, "сумівська", "CYM");
    s = replaceWordsPreserveCase(s, "сумівські", "CYM");
    s = replaceWordsPreserveCase(s, "Данило Сенторе", "Danylo Centore");
    s = replaceWordsPreserveCase(s, "Соломія Хтей", "Solomea Khtey");
    s = replaceWordsPreserveCase(s, "Іреней Коваль", "Ireneus Kowal");
    s = replaceWordsPreserveCase(s, "ю2", "Oldest Plast Camp");
    s = replaceWordsPreserveCase(s, "упюів", "Older Plast Boys");
    s = replaceWordsPreserveCase(s, "упю-ів", "Older Plast Boys");
    s = replaceWordsPreserveCase(s, "упюок", "Older Plast Girls");
    s = replaceWordsPreserveCase(s, "упю-ок", "Older Plast Girls");
    s = replaceWordsPreserveCase(s, "упнів", "Younger Plast Boys");
    s = replaceWordsPreserveCase(s, "упн-ів", "Younger Plast Boys");
    s = replaceWordsPreserveCase(s, "упнок", "Younger Plast Girls");
    s = replaceWordsPreserveCase(s, "упн-ок", "Younger Plast Girls");
    s = replaceWordsPreserveCase(s, "упю", "Older Plastuny");
    s = replaceWordsPreserveCase(s, "упн", "Younger Plastuny");
    s = replaceWordsPreserveCase(s, "приспів", "chorus");
    s = replaceWordsPreserveCase(s, "стрічка", "verse");
    s = replaceWordsPreserveCase(s, "стрічки", "verses");
    s = replaceWordsPreserveCase(s, "шластові", "Plast");
    s = replaceWordsPreserveCase(s, "необов'язково", "optional");
    s = replaceWordsPreserveCase(s, "слова", "lyrics");
    s = replaceWordsPreserveCase(s, "мелодія", "melody");
    s = replaceWordsPreserveCase(s, "музика", "music");
    s = replaceWordsPreserveCase(s, "і", "and");
    s = replaceWordsPreserveCase(s, "народна", "folk");
    s = replaceWordsPreserveCase(s, "народні", "folk");
    s = replaceWordsPreserveCase(s, "невідомий", "unknown");
    s = replaceWordsPreserveCase(s, "обробка", "arrangement");
    s = replaceWordsPreserveCase(s, "переклад приспіву", "chorus translation");
    s = replaceWordsPreserveCase(s, "переклад стрічки", "verse translation");
    s = replaceWordsPreserveCase(s, "переклад", "translation");
    s = replaceWordsPreserveCase(s, "зміст", "index");
    s = replaceWordsPreserveCase(s, "від", "from");
    s = replaceWordsPreserveCase(s, "до", "to");
    s = replaceWordsPreserveCase(s, "можливо", "perhaps");
    s = replaceWordsPreserveCase(s, "версія", "version");
    s = replaceWordsPreserveCase(s, "пісня з кіно", "song from the movie");
    s = replaceWordsPreserveCase(s, "обробка слів", "lyrics arrangement");
    s = replaceWordsPreserveCase(s, "пісня куреня", "song from the kurin");
    s = replaceWordsPreserveCase(s, "головний", "main");
    s = replaceWordsPreserveCase(s, "варіант", "version");
    s = replaceWordsPreserveCase(s, "варіянт", "version");
    s = replaceWordsPreserveCase(s, "на основі", "based on");
    s = replaceWordsPreserveCase(s, "ч\\.", "no.");
    s = replaceWordsPreserveCase(s, "ім\\.", "named for");
    s = replaceWordsPreserveCase(s, "англ.", "Eng.");
    s = replaceWordsPreserveCase(s, "кавер", "cover");
    s = replaceWordsPreserveCase(s, "рефрен", "refrain");
    s = replaceWordsPreserveCase(s, "вступ", "intro");
    s = replaceWordsPreserveCase(s, "німецька", "German");
    s = replaceWordsPreserveCase(s, "німецької", "German");
    s = replaceWordsPreserveCase(s, "німецькою", "German");
    s = replaceWordsPreserveCase(s, "польска", "Polish");
    s = replaceWordsPreserveCase(s, "російська", "Russian");
    s = replaceWordsPreserveCase(s, "російської", "Russian");
    s = replaceWordsPreserveCase(s, "цуганська", "Roma");
    s = replaceWordsPreserveCase(s, "української", "Ukrainian");
    s = replaceWordsPreserveCase(s, "українською", "Ukrainian");
    s = replaceWordsPreserveCase(s, "о\\.", "Fr.");
    s = replaceWordsPreserveCase(s, "латинської", "Latin");
    s = replaceWordsPreserveCase(s, "українські січові стрільці", "Ukrainian Sich Riflemen");
    s = replaceWordsPreserveCase(s, "усс", "Ukrainian Sich Riflemen");
    s = replaceWordsPreserveCase(s, "мабуть", "probably");

    return s;
}

const UKRAINIAN_LETTERS = '';

function getStandardPhonetic(s: string): string {
    // UNT Simplified
    // Replace apostrophe after a cyrillic letter with nothing
    // Must be first so we don't replace the
    const regex = /([абвгґдеєжзиіїйклмнопрстуфхцчшщюяьАБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЮЯЬ])['’]/gu
    s = s.replace(regex, function match(match, ...args) {
        return args[0];
    });

    // Special WikiSpiv exceptions
    s = replacePreserveCase(s, "йде", "ide");
    s = replacePreserveCase(s, "йдіть", "idit");

    // This is mostly BGN/PCGN but combined with some of
    // the rules from Ukrainian National transliteration
    // and a few additions of my own

    // UNT Simplified
    s = replacePreserveCase(s, "жж", "zh");
    s = replacePreserveCase(s, "хх", "kh");
    s = replacePreserveCase(s, "цц", "ts");
    s = replacePreserveCase(s, "чч", "ch");
    s = replacePreserveCase(s, "шш", "sh");

    // BGN/PCGN clarifications
    s = replacePreserveCase(s, "зг", "z-h");
    s = replacePreserveCase(s, "кг", "k-h");
    s = replacePreserveCase(s, "сг", "s-h");
    s = replacePreserveCase(s, "цг", "ts-h");

    // WikiSpiv
    s = replacePreserveCase(s, "ьо", "yo");
    s = replacePreserveCase(s, "ий", "iy");
    s = replacePreserveCase(s, "ай", "ai");
    s = replacePreserveCase(s, "та й", "tai");
    s = replacePreserveCase(s, "щ", "sch");
    s = replacePreserveCase(s, "э", "e");
    s = replacePreserveCase(s, "ё", "yo");
    s = replacePreserveCase(s, "ы", "y");
    s = replacePreserveCase(s, "ѣ", "i");
    s = replacePreserveCase(s, "ў", "w");
    s = replacePreserveCase(s, "ъ", "");

    // BGN/PCGN
    s = replacePreserveCase(s, "ь", "'");

    // BGN/PCGN
    s = replacePreserveCase(s, "а", "a");
    s = replacePreserveCase(s, "б", "b");
    s = replacePreserveCase(s, "в", "v");
    s = replacePreserveCase(s, "г", "h");
    s = replacePreserveCase(s, "ґ", "g");
    s = replacePreserveCase(s, "д", "d");
    s = replacePreserveCase(s, "е", "e");
    s = replacePreserveCase(s, "є", "ye");
    s = replacePreserveCase(s, "ж", "zh");
    s = replacePreserveCase(s, "з", "z");
    s = replacePreserveCase(s, "и", "y");
    s = replacePreserveCase(s, "і", "i");
    s = replacePreserveCase(s, "ї", "yi");
    s = replacePreserveCase(s, "й", "y");
    s = replacePreserveCase(s, "к", "k");
    s = replacePreserveCase(s, "л", "l");
    s = replacePreserveCase(s, "м", "m");
    s = replacePreserveCase(s, "н", "n");
    s = replacePreserveCase(s, "о", "o");
    s = replacePreserveCase(s, "п", "p");
    s = replacePreserveCase(s, "р", "r");
    s = replacePreserveCase(s, "с", "s");
    s = replacePreserveCase(s, "т", "t");
    s = replacePreserveCase(s, "у", "u");
    s = replacePreserveCase(s, "ф", "f");
    s = replacePreserveCase(s, "х", "kh");
    s = replacePreserveCase(s, "ц", "ts");
    s = replacePreserveCase(s, "ч", "ch");
    s = replacePreserveCase(s, "ш", "sh");
    s = replacePreserveCase(s, "ю", "yu");
    s = replacePreserveCase(s, "я", "ya");

    return s;
}

function replaceWordsPreserveCase(
    haystack: string,
    needle: string,
    replace: string,
): string {
    return replacePreserveCase(
        haystack,
        needle,
        replace,
        true,
    );
}

function replacePreserveCase(
    haystack: string,
    needle: string,
    replace: string,
    wordBoundaries?: boolean,
): string {
    // This would be much easier if \b worked with unicode...
    const regex = new RegExp(
        (wordBoundaries ? String.raw`(^|[^\n\p{L}])` : '')
        + needle
        + (wordBoundaries ? String.raw`(?=$|\P{L})` : ''),
        "gimu",
    );
    return haystack.replace(regex, function (match, ...args) {
        let r = replace;
        if (isUpperCase(match.charAt(0))) {
            r = replace.charAt(0).toUpperCase() + replace.substring(1);
        }
        if (wordBoundaries) {
            return args[0] + r;
        }
        return r;
    });
}

function isUpperCase(str: string) {
    return str === str.toUpperCase() && str !== str.toLowerCase();
}