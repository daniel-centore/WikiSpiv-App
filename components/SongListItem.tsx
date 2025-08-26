import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Song from '../interfaces/Song';
import { HIGH_PRI_FETCH, RootState, store, updateFavorite } from '../store/store';
import { backgroundColorPrimary, backgroundColorSecondary, useDark, textColorPrimary } from '../utils/color';
import { getPhonetic } from '../utils/phonetic';
import { getLatestSong } from '../utils/wikispivUtils';
import PressableDebounce from './PressableDebounce';
import { View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { FavoriteButton } from './FavoriteButton';

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
    const [pressed, setPressed] = useState(false);

    return (
        <View
            style={{
                height: props.height,
                paddingLeft: 5,
                backgroundColor:
                    props.index % 2 === 0
                        ? backgroundColorPrimary(dark, pressed)
                        : backgroundColorSecondary(dark, pressed),
                display: 'flex',
                flexDirection: 'row',
            }}
        >
            <View style={{ flex: 0, justifyContent: 'center' }}>
                <FavoriteButton song={props.song} />
            </View>
            <View style={{ flex: 1 }}>
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
                    onPressIn={() => setPressed(true)}
                    onPressOut={() => setPressed(false)}
                >
                    <View
                        style={{
                            paddingRight: 20,
                            justifyContent: 'center',
                            height: props.height,
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
                </PressableDebounce>
            </View>
        </View>
    );
}
