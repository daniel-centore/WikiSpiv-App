import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { CategoriesStackParamList } from './CategoriesNavigation';
import FlatListQuickScroll, { FLQSListItem } from '../components/FlatListQuickScroll/FlatListQuickScroll';
import { _renderListItem } from './SearchScreen';
import ScrollContextHelper from '../components/ScrollContextHelper';
import {
    scrollbarHandleColor,
    scrollbarHeaderBackgroundColor,
    scrollbarHeaderTextColor,
    scrollbarLineColor,
    useDark,
} from '../utils/color';
import { RootState, store } from '../store/store';
import { getHeaderedSongs } from '../utils/filtering';
import getSortedSongsAndRedirects from '../utils/sorting';
import { useSelector } from 'react-redux';
import { View } from 'react-native';

export default function FavoriteSongsScreen (props: { navigation: StackNavigationProp<any> }) {
    const dark = useDark();
    const songs = useSelector((state: RootState) => state.songs);
    const phonetic = useSelector((state: RootState) => state.phoneticMode);

    const scrollContext = new ScrollContextHelper('favorites_scroll');

    const filteredEntries = songs.filter(song => song.local.favorite);
    const sortedEntries = getSortedSongsAndRedirects(filteredEntries, phonetic);
    const headeredSongs = getHeaderedSongs(sortedEntries);

    return (
        <View style={{ flex: 1 }}>
            <FlatListQuickScroll
                data={headeredSongs}
                renderItem={_renderListItem}
                context={scrollContext}
                scrollViewProps={{
                    keyboardShouldPersistTaps: 'handled',
                }}
                scrollLineColor={scrollbarLineColor(dark)}
                scrollHandleColor={scrollbarHandleColor(dark)}
                scrollHeaderBackgroundColor={scrollbarHeaderBackgroundColor(dark)}
                scrollHeaderTextColor={scrollbarHeaderTextColor(dark)}
            />
        </View>
    );
}
