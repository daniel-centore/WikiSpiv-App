import React from "react";
import { View } from "react-native";
import Line from "./Line";
import Song from "./Song";

export default class Stanza {

    public lines: Line[];

    constructor(
        public content: string,
        public song: Song,
    ) {
        this.lines = this._makeLines(content)
    }

    getReactView(dark: boolean, idx: number, isLast: boolean, showChord: boolean): {
        element: JSX.Element,
        height: number,
    } {
        const lines = this.lines.map((line, idx2) => line.getReactView(dark, idx2, showChord));
        const paddingBottom = isLast ? 0 : 15;
        const linesHeight = lines.map(line => line.height)
            .reduce((a, b) => a + b);
        const height = linesHeight + paddingBottom;

        const element = (
            <View
                key={idx + '|' + this.content}
                style={{
                    flexDirection: "column",
                    paddingBottom,
                }}
            >
                {lines.map(line => line.element)}
            </View>
        );

        return {
            element,
            height,
        }
    }

    // This function translated to JS from the bookmaker's Stanze.makeLines()
    _makeLines(rawContent: string): Line[] {
        const result = [] as Line[];

        const split = rawContent.split("\n");
        let lastChord = null as string | null;
        let lastWasChord = false;
        let lastWasIndented = false;
        for (let i = 0; i < split.length; ++i) {
            const s = split[i];
            if (s.trim().length === 0) {
                continue;
            }
            const isChord = s.startsWith(";");
            const lyricIsInstruction = s.startsWith("!");
            const isIndented = s.length >= 2 && (s.charAt(1) == ';' || s.charAt(1) == ':');
            let line = s;
            const ps = ["::", ":;", ";:", ";;", ":", ";", "!"];
            for (let j = 0; j < ps.length; j++) {
                const p = ps[j];
                if (s.startsWith(p)) {
                    line = s.substring(p.length);
                    break;
                }
            }

            if (isChord) {
                if (lastWasChord) {
                    const l = new Line(lastChord, null, isIndented, false, this.song);
                    result.push(l);
                }
                lastChord = line;
            } else {
                if (lastWasChord) {
                    const l = new Line(lastChord, line, isIndented, lyricIsInstruction, this.song);
                    result.push(l);
                    lastChord = null;
                } else {
                    const l = new Line(null, line, isIndented, lyricIsInstruction, this.song);
                    result.push(l);
                }
            }
            lastWasChord = isChord;
            lastWasIndented = isIndented;
        };
        // Cover situation where last line is a chord
        if (lastWasChord) {
            const l = new Line(lastChord, null, lastWasIndented, false, this.song);
            result.push(l);
        }

        return result;
    }
}