import React from "react";
import { View } from "react-native";
import Stanza from "../interfaces/Stanza";
import { Text } from "native-base";
import { backgroundColorPrimary, textColorPrimary, useDark } from "../utils/color";
import Song from "../interfaces/Song";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { getPhonetic } from "../utils/phonetic";

interface IProps {
    dark: boolean,
    showChord: boolean,
    credits: string | null,
    stanzas: Stanza[],
    song: Song,
}

type ElementWithHeight = {
    element: JSX.Element;
    height: number;
}

export default class SongView extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);
    }

    render() {
        const props = this.props;
        const dark = props.dark;
        const stanzas = props.stanzas;
        const credits = props.credits;

        const numColumns = props.song.local.columns;

        const stanzaRenders = stanzas.map(
            (stanza, idx) => stanza.getReactView(
                dark,
                idx,
                idx === stanzas.length - 1,
                props.showChord
            )
        );
        const columnsRaw = this._columnize(stanzaRenders, numColumns);
        const columns = [];
        for (let i = 0; i < columnsRaw.length; ++i) {
            columns.push((
                <View
                    key={props.song.init.name + '|column_' + i}
                    style={{
                        flexDirection: "column",
                        marginRight: 15,
                    }}
                >
                    {columnsRaw[i].map(col => col.element)}
                </View>
            ))
        }


        return (
            <View style={{
                flexDirection: "column",
                backgroundColor: backgroundColorPrimary(dark),
                marginBottom: 50,
            }}>
                <Credits credits={credits} />
                <View style={{ flexDirection: "row" }}>
                    {columns}
                </View>
            </View>
        );
    }

    _columnize(
        elements: ElementWithHeight[],
        columns: number) {
        const heights = elements.map(el => el.height);
        const tallestElement = Math.max(...heights);

        // How precise to be with the ideal column height
        const DELTA = 1;
        for (let height = tallestElement; true; height += DELTA) {
            const wrap = this._wrap(elements, height);
            if (wrap.length > columns) {
                continue;
            }
            return wrap;
        }
    }

    _wrap(
        elements: ElementWithHeight[],
        height: number
    ) {
        const result = [];
        let currentCol = [] as ElementWithHeight[];
        let currentColHeight = 0;
        for (let i = 0; i < elements.length; ++i) {
            const el = elements[i];
            if (el.height > height) {
                throw 'height < minimum height'
            }
            if (currentColHeight + el.height > height) {
                result.push(currentCol);
                currentCol = [];
                currentColHeight = 0;
            }
            currentCol.push(el);
            currentColHeight += el.height;
        }
        result.push(currentCol);


        return result;
    }
}

function Credits(props: { credits: string | null }) {
    const dark = useDark();
    const phonetic = useSelector((state: RootState) => state.phoneticMode);

    return props.credits === null ? null :
        <Text
            color={textColorPrimary(dark)}
            italic={true}
            fontSize={14}
            lineHeight={18}
            marginBottom={15}
        >
            {getPhonetic(phonetic, props.credits, true)}
        </Text>
}