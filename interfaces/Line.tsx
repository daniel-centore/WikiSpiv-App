import React from "react";
import { View } from "react-native";
import { isSpaceChar } from "../utils/simpleUtils";
import Chunk from "./Chunk";
import Song from "./Song";

export default class Line {
    public chunks: Chunk[];

    constructor(
        public chordLine: string | null,
        public lyricLine: string | null,
        public isIndented: boolean,
        public lyricIsInstruction: boolean,
        public song: Song,
    ) {
        this.chunks = this._makeChunks();
    }

    getReactView(dark: boolean, idx: number, showChord: boolean): {
        element: JSX.Element,
        height: number,
    } {
        const chunks = this.chunks.map((chunk, idx2) => chunk.getReactView(idx2, showChord));
        const height = Math.max(...chunks.map(chunk => chunk.height));
        const element = (
            <View
                style={{
                    flexDirection: "row",
                    marginLeft: this.isIndented ? 15 : 0,
                }}
                key={idx + '|' + this.chordLine + '|' + this.lyricLine + '|' + this.isIndented + this.lyricIsInstruction}
            >
                {chunks.map(chunk => chunk.element)}
            </View>
        );
        return {
            element,
            height,
        }
    }

    // This function translated to JS from the bookmaker's Line.getChunks()
    _makeChunks(): Chunk[] {
        if (this.lyricLine == null) {
            return [new Chunk(this.song, this.chordLine, null, false)];
        } else if (this.chordLine == null) {
            return [new Chunk(this.song, null, this.lyricLine, this.lyricIsInstruction)];
        } else {
            return this._smush(this.chordLine, this.lyricLine);
        }
    }

    // This function translated to JS from the bookmaker's Line.smush()
    _smush(chordLine: string, lyricLine: string): Chunk[] {
        const result = [] as Chunk[];

        // Dictionary from start index to the chord
        const chordIndices = [] as number[];
        const chords = {} as { [id: number]: string };

        // kludge to show the first chunk if no chord there
        chordIndices.push(0);
        chords[0] = "";

        let i = 0;
        while (i < chordLine.length) {
            if (!isSpaceChar(chordLine.charAt(i))) {
                let startPos = i;
                let chord = "";
                while (i < chordLine.length && !isSpaceChar(chordLine.charAt(i))) {
                    chord += chordLine.charAt(i);
                    i++;
                }
                if (!chordIndices.includes(startPos)) {
                    chordIndices.push(startPos);
                }
                chords[startPos] = chord;
            } else {
                i++;
            }
        }

        // Now go thru the text
        for (let j = 0; j < chordIndices.length; j++) {
            const startPos = chordIndices[j];
            const chord = chords[startPos];

            let text = "";
            for (
                let i = startPos;
                i < lyricLine.length && (i == startPos || !(i in chords));
                ++i
            ) {
                text += lyricLine.charAt(i);
            }
            result.push(new Chunk(this.song, chord, text, this.lyricIsInstruction));
        }
        return result;
    }
}