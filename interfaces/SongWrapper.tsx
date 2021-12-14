import Song from "./Song";
import Stanza from "./Stanza";
import wtf_wikipedia from 'wtf_wikipedia';

export default class SongWrapper {

    constructor(public song: Song) {
    }

    // This function translated to JS from the bookmaker's Song.makeStanzas()
    makeStanzas(): Stanza[] | null {
        let content = this.getSpiv();
        if (content === null) {
            return null;
        }
        if (!content.endsWith("\n")) {
            content += "\n";
        }
        const result = [] as Stanza[];
        // The -1 makes it so we get the trailing newline
        const lines = content.split("\n");
        let currentStanza = "";
        for (let i = 0; i < lines.length; ++i) {
            const line = lines[i];
            if (line.trim().length === 0 || line.trim() === ":") {
                if (currentStanza.length > 0) {
                    const stan = new Stanza(currentStanza, this.song);
                    result.push(stan);
                    currentStanza = "";
                }
            } else {
                currentStanza += line + "\n";
            }
        };
        return result;
    }

    getBetweenTags(tag: string) {
        if (this.song.populated === null) {
            return null;
        }

        const regex = new RegExp('<' + tag + '>((.|\n)*)<\/' + tag + '>');
        const groups = regex.exec(this.song.populated.wikitext);

        if (groups === null || groups.length < 2) {
            return null;
        }
        return groups[1].trim();
    }

    getSpiv(): string | null {
        return this.getBetweenTags('spiv');
    }

    getCreditsRaw(): string | null {
        return this.getBetweenTags('credits');
    }

    getCleanCredits(): string | null {
        const credits = this.getCreditsRaw();
        if (!credits) {
            return null;
        }
        const creditsDoubled = credits
            .replace(/\n/g, "\n\n")
            .replace(/<br.*>>/g, "\n\n");

        return wtf_wikipedia(creditsDoubled)
            .text()
            .replace(/\n\n/g, "\n");
    }
}