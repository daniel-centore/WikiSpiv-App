import React from 'react';
import { Alert, Linking, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';
import Song from '../interfaces/Song';
import { ChordModeSetting, DarkModeSetting, PhoneticModeSetting } from '../store/SettingEnums';
import {
    HIGH_PRI_FETCH,
    RootState,
    store,
    transposeSong,
    updateChordMode,
    updateColumns,
    updateDarkMode,
    updatePhoneticMode,
    updateShowTransposition,
} from '../store/store';
import { backgroundColorMenu, textColorPrimary, useDark } from '../utils/color';
import { useLatestSong } from '../utils/wikispivUtils';
import { Divider, IconButton, Menu } from 'react-native-paper';

export default function SongHeaderMenu (props: { song: Song }) {
    const [visible, setVisible] = React.useState(false);

    const dark = useDark();
    const song = useLatestSong(props.song);
    const transposition = useSelector((state: RootState) => state.transposition);
    const chordsModeSetting = useSelector((state: RootState) => state.chordsMode);
    const phoneticModeSetting = useSelector((state: RootState) => state.phoneticMode);
    const textParams: StyleProp<TextStyle> = {};
    const styleParams: StyleProp<ViewStyle> = {};

    const isChordChecked = chordsModeSetting !== ChordModeSetting.NO_CHORDS;
    const url =
        'https://www.wikispiv.com/wiki/' +
        encodeURIComponent(song.init.name.replace(/\ /g, '_'))
            // forward slash is an exception which gets processed normally
            .replace(/%2F/g, '/');
    const isColumnsChecked = song.local.columns > 1;

    return (
        <Menu
            visible={visible}
            onDismiss={() => setVisible(false)}
            style={{
                backgroundColor: backgroundColorMenu(dark),
            }}
            anchor={
                <IconButton
                    icon='dots-vertical'
                    iconColor={textColorPrimary(dark)}
                    size={20}
                    onPress={() => setVisible(true)}
                />
            }
        >
            <Menu.Item
                title={(isColumnsChecked ? '✓ ' : '') + 'Columns / Стовпці'}
                style={styleParams}
                titleStyle={textParams}
                onPress={() => {
                    store.dispatch({
                        type: updateColumns.toString(),
                        payload: {
                            song: song,
                            columns: isColumnsChecked ? 1 : 2,
                        },
                    });
                }}
            />
            <Menu.Item
                title={(phoneticModeSetting !== PhoneticModeSetting.OFF ? '✓ ' : '') + 'Phonetic / Фонетично'}
                style={styleParams}
                titleStyle={textParams}
                onPress={() => {
                    const newValue =
                        phoneticModeSetting === PhoneticModeSetting.OFF
                            ? PhoneticModeSetting.STANDARD
                            : PhoneticModeSetting.OFF;
                    store.dispatch({ type: updatePhoneticMode.toString(), payload: newValue });
                }}
            />
            <Menu.Item
                title={(isChordChecked ? '✓ ' : '') + 'Chords / Акорду'}
                style={styleParams}
                titleStyle={textParams}
                onPress={() => {
                    const newValue = !isChordChecked ? ChordModeSetting.BASIC_CHORDS : ChordModeSetting.NO_CHORDS;
                    store.dispatch({ type: updateChordMode.toString(), payload: newValue });
                    if (newValue === ChordModeSetting.NO_CHORDS) {
                        store.dispatch({ type: updateShowTransposition.toString(), payload: false });
                    }
                }}
            />
            <Menu.Item
                title={(transposition ? '✓ ' : '') + 'Transpose / Транспозиція'}
                style={styleParams}
                titleStyle={textParams}
                onPress={() => {
                    store.dispatch({ type: updateShowTransposition.toString(), payload: !transposition });
                    if (!isChordChecked) {
                        store.dispatch({ type: updateChordMode.toString(), payload: ChordModeSetting.BASIC_CHORDS });
                    }
                }}
            />
            <Menu.Item
                title={(dark ? '✓ ' : '') + 'Dark / Темний'}
                style={styleParams}
                titleStyle={textParams}
                onPress={() => {
                    store.dispatch({
                        type: updateDarkMode.toString(),
                        payload: dark ? DarkModeSetting.LIGHT : DarkModeSetting.DARK,
                    });
                }}
            />
            <Divider bold />
            <Menu.Item
                title='Open in Browser / Відкрити в браузері'
                style={styleParams}
                titleStyle={textParams}
                onPress={() => {
                    setVisible(false);
                    Linking.canOpenURL(url).then(supported => {
                        if (supported) {
                            Linking.openURL(url);
                        } else {
                            Alert.alert('Oops :(', "Couldn't open in the browser for some reason ¯\\_(ツ)_/¯", [
                                {
                                    text: 'OK',
                                },
                            ]);
                        }
                    });
                }}
            />
            <Menu.Item
                title='Reload / Перезавантажити'
                style={styleParams}
                titleStyle={textParams}
                onPress={() => {
                    setVisible(false);
                    store.dispatch({ type: HIGH_PRI_FETCH, payload: song });
                }}
            />
        </Menu>
    );
}
