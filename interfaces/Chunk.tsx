import React, { useEffect } from "react";
import { View } from "react-native";
import { Text } from "native-base";
import { textColorPrimary, textColorSecondary, useDark } from "../utils/color";
import { RootState, store } from "../store/store";
import { ChordModeSetting } from "../store/SettingEnums";
import { getPhonetic } from "../utils/phonetic";
import Song from "./Song";
// @ts-ignore
import { parse, transpose, prettyPrint } from 'chord-magic'
import { fuckNegativeZero } from "../utils/simpleUtils";
import { useSelector } from "react-redux";

const CHORD_HEIGHT = 14;
const LYRICS_HEIGHT = 18;

export default class Chunk {
    public chord: string | null;
    constructor(
        public song: Song,
        chordIn: string | null,
        public text: string | null,
        public lyricIsInstruction: boolean,
    ) {
        const transposition = fuckNegativeZero((song.local.transposition ?? 0) % 12);
        if (chordIn === null) {
            this.chord = null
        } else if (transposition === 0) {
            this.chord = chordIn;
        } else {
            try {
                const regex = /[ABCDEFGH]+[\/#ABCDEFGabcdefghijklmnopqrstuvwxyz1234567890+-]*/g;
                this.chord = chordIn.replace(regex, function match(match, ...args) {
                    const chordParse = parse(match)
                    const transposed = transpose(chordParse, transposition)
                    return prettyPrint(transposed);
                });
            } catch (e) {
                this.chord = chordIn;
            }
        }
    }

    getReactView(idx: number, showChord: boolean): {
        element: JSX.Element,
        height: number,
    } {
        const element = <ChunkImpl
            key={idx + '|' + this.chord + '|' + this.text}
            idx={idx}
            chord={this.chord}
            text={this.text}
            lyricIsInstruction={this.lyricIsInstruction}
        />;
        const height = (this.text === null ? 0 : LYRICS_HEIGHT)
            + ((!showChord || this.chord === null) ? 0 : CHORD_HEIGHT);
        return {
            element,
            height,
        }
    }
}

function ChunkImpl(props: {
    chord: string | null,
    text: string | null,
    lyricIsInstruction: boolean,
    idx: number,
}) {
    const dark = useDark();
    const chordsModeSetting = useSelector((state: RootState) => state.chordsMode);
    const phoneticModeSetting = useSelector((state: RootState) => state.phoneticMode);

    const showChord = chordsModeSetting !== ChordModeSetting.NO_CHORDS;
    return (
        <View
            style={{ flexDirection: "column" }}
        >
            {
                !showChord || props.chord === null ? null
                    : <Text
                        color={textColorSecondary(dark)}
                        bold={true}
                        fontSize={12}
                        lineHeight={CHORD_HEIGHT}
                    >
                        {props.chord.length === 0 ? ' ' : props.chord + ' '}
                    </Text>
            }
            {
                props.text === null ? null
                    : <Text
                        color={textColorPrimary(dark)}
                        bold={props.lyricIsInstruction}
                        italic={props.lyricIsInstruction}
                        fontSize={14}
                        lineHeight={LYRICS_HEIGHT}
                    >
                        {getPhonetic(phoneticModeSetting, props.text, props.lyricIsInstruction)}
                    </Text>
            }
        </View>
    );
}