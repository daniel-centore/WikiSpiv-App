import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import Song from '../interfaces/Song';
import { HIGH_PRI_FETCH, RootState, store } from '../store/store';
import { backgroundColorPrimary, backgroundColorSecondary, useDark, textColorPrimary } from '../utils/color';
import { getPhonetic } from '../utils/phonetic';
import { getLatestSong } from '../utils/wikispivUtils';
import PressableDebounce from './PressableDebounce';
import { View } from 'react-native';
import { Text } from 'react-native-paper';

export default function SongListItem (props: {
    song: Song;
    index: number;
    title: string;
    height: number;
    isRedirect: boolean;
}) {
    const dark = useDark();
    const navigation = useNavigation<StackNavigationProp<any>>();
    const phoneticModeSetting = useSelector((state: RootState) => state.phoneticMode);

    const displayTitle = getPhonetic(phoneticModeSetting, props.title);
    return (
        <PressableDebounce
            onPress={() => {
                const latestSong = getLatestSong(props.song) || props.song;
                navigation.push('song', {
                    song: latestSong,
                });
                if (!latestSong.populated) {
                    // console.log('PUSHING HIGH PRI REQUEST')
                    store.dispatch({ type: HIGH_PRI_FETCH, payload: latestSong });
                }
            }}
        >
            {({ pressed }) => (
                <View
                    style={{
                        height: props.height,
                        paddingLeft: 10,
                        backgroundColor:
                            props.index % 2 === 0
                                ? backgroundColorPrimary(dark, pressed)
                                : backgroundColorSecondary(dark, pressed),
                    }}
                >
                    <Text
                        style={{
                            color: textColorPrimary(dark),
                            fontSize: 18,
                            fontWeight: 'bold',
                            fontStyle: props.isRedirect ? 'italic' : 'normal',
                        }}
                        numberOfLines={2}
                    >
                        {displayTitle}
                    </Text>
                </View>
            )}
        </PressableDebounce>
    );
}
