import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React, { ReactNode, useEffect } from 'react';
import { Button, GestureResponderEvent, View } from 'react-native';
import { useSelector } from 'react-redux';
import Song from '../interfaces/Song';
import { RootState, store, transposeSong } from '../store/store';
import { backgroundColorSecondary, textColorPrimary, useDark } from '../utils/color';
import PressableDebounce from './PressableDebounce';
import { IconButton, Text } from 'react-native-paper';

export default function TranspositionToolbar (props: { song: Song }) {
    const dark = useDark();
    const transposition = useSelector((state: RootState) => state.transposition);

    if (!transposition) {
        return null;
    }
    return (
        <View
            style={{
                paddingTop: 0,
                paddingBottom: 10,
                backgroundColor: backgroundColorSecondary(dark),
                alignItems: 'center',
                width: '100%',
            }}
        >
            <View
                style={{
                    flexDirection: 'row',
                }}
            >
                <IconButton
                    icon='arrow-up-bold'
                    iconColor={textColorPrimary(dark)}
                    size={30}
                    onPress={() => {
                        transpose(props.song, -1);
                    }}
                />
                <IconButton
                    icon='close-circle-outline'
                    size={30}
                    onPress={() => {
                        transpose(props.song, 0);
                    }}
                />
                <IconButton
                    icon='arrow-down-bold'
                    size={30}
                    onPress={() => {
                        transpose(props.song, 1);
                    }}
                />
            </View>
            <View>
                <Text style={{ color: textColorPrimary(dark), fontSize: 14, fontWeight: 'bold' }}>
                    {'Transposition / Транспозиція'}
                </Text>
            </View>
        </View>
    );
}

function transpose (song: Song, offset: number) {
    const amount = offset === 0 ? 0 : (song.local?.transposition ?? 0) + offset;
    store.dispatch({ type: transposeSong.toString(), payload: { song: song, amount: amount } });
}
