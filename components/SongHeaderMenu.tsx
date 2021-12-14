import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Divider, Icon, ITextProps, Menu } from "native-base";
import React, { useEffect } from "react";
import { Alert, Linking, Pressable, StyleProp, ViewStyle } from "react-native";
import { useSelector } from "react-redux";
import Song from "../interfaces/Song";
import { ChordModeSetting, PhoneticModeSetting } from "../store/SettingEnums";
import { HIGH_PRI_FETCH, RootState, store, transposeSong, updateChordMode, updateColumns, updatePhoneticMode, updateShowTransposition } from "../store/store";
import { backgroundColorMenu, textColorPrimary, useDark } from "../utils/color";
import { useLatestSong } from "../utils/wikispivUtils";

export default function SongHeaderMenu(props: { song: Song }) {
    const dark = useDark();
    const song = useLatestSong(props.song);
    const transposition = useSelector((state: RootState) => state.transposition);
    const chordsModeSetting = useSelector((state: RootState) => state.chordsMode);
    const phoneticModeSetting = useSelector((state: RootState) => state.phoneticMode);
    const textParams: ITextProps = {
        style: {
            color: textColorPrimary(dark),
            fontSize: 16,
        }
    };
    const styleParams: StyleProp<ViewStyle> = {
        paddingVertical: 35,
    };

    const isChordChecked = (chordsModeSetting !== ChordModeSetting.NO_CHORDS);
    const url = 'https://www.wikispiv.com/wiki/'
        + encodeURIComponent(
            song.init.name.replace(/\ /g, '_')
        )
            // forward slash is an exception which gets processed normally
            .replace(/%2F/g, '/');
    const isColumnsChecked = song.local.columns > 1;

    return (
        <Menu
            style={{
                paddingTop: 15,
                paddingRight: 20,
                backgroundColor: backgroundColorMenu(dark),
            }}
            trigger={(triggerProps) => {
                return (
                    <Pressable {...triggerProps} style={{
                        paddingRight: 10
                    }}>
                        <Icon
                            margin="2"
                            marginRight="3"
                            size="6"
                            color={textColorPrimary(dark)}
                            as={<MaterialCommunityIcons name="dots-vertical" />}
                        />
                    </Pressable>
                )
            }}
        >
            <Menu.Item _text={textParams} style={styleParams} onPress={() => {
                store.dispatch({
                    type: updateColumns,
                    payload: {
                        song: song,
                        columns: isColumnsChecked ? 1 : 2,
                    },
                });
            }}>
                {(isColumnsChecked ? '✓ ' : '') + 'Columns / Стовпці'}
            </Menu.Item>
            <Menu.Item _text={textParams} style={styleParams} onPress={() => {
                const newValue = phoneticModeSetting === PhoneticModeSetting.OFF
                    ? PhoneticModeSetting.STANDARD
                    : PhoneticModeSetting.OFF;
                store.dispatch({ type: updatePhoneticMode, payload: newValue });
            }}>
                {(phoneticModeSetting !== PhoneticModeSetting.OFF ? '✓ ' : '') + 'Phonetic / Фонетично'}
            </Menu.Item>
            <Menu.Item _text={textParams} style={styleParams} onPress={() => {
                const newValue = !isChordChecked ? ChordModeSetting.BASIC_CHORDS : ChordModeSetting.NO_CHORDS;
                store.dispatch({ type: updateChordMode, payload: newValue });
                if (newValue === ChordModeSetting.NO_CHORDS) {
                    store.dispatch({ type: updateShowTransposition, payload: false });
                }
            }}>
                {(isChordChecked ? '✓ ' : '') + 'Chords / Акорду'}
            </Menu.Item>
            <Menu.Item _text={textParams} style={styleParams} onPress={() => {
                store.dispatch({ type: updateShowTransposition, payload: !transposition });
                if (!isChordChecked) {
                    store.dispatch({ type: updateChordMode, payload: ChordModeSetting.BASIC_CHORDS });
                }
            }}>
                {(transposition ? '✓ ' : '') + 'Transpose / Транспозиція'}
            </Menu.Item>
            <BetterDivider />
            <Menu.Item _text={textParams} style={styleParams} onPress={() => {
                Linking.canOpenURL(url).then(supported => {
                    if (supported) {
                        Linking.openURL(url);
                    } else {
                        Alert.alert(
                            "Oops :(",
                            "Couldn't open in the browser for some reason ¯\\_(ツ)_/¯",
                            [
                                {
                                    text: "OK",
                                },
                            ]
                        );
                    }
                });
            }}>
                Open in Browser / Відкрити в браузері
            </Menu.Item>
            <Menu.Item _text={textParams} style={styleParams} onPress={() => {
                store.dispatch({ type: HIGH_PRI_FETCH, payload: song })
            }}>
                Reload / Перезавантажити
            </Menu.Item>
        </Menu>
    );
}

function BetterDivider() {
    return <Divider style={{
        marginVertical: 10,
    }} />;
}