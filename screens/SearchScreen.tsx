import React, { useRef } from 'react';
import {
    Keyboard,
    View,
    TextInput as ReactNativeTextInput,
} from 'react-native';
import { useSelector } from 'react-redux';
import FlatListQuickScroll, { FLQSListItemProcessed } from '../components/FlatListQuickScroll/FlatListQuickScroll';
import ListItem from '../components/ListItem';
import ScrollContextHelper from '../components/ScrollContextHelper';
import { RootState, store, updateSearchText } from '../store/store';
import {
    backgroundColorMainView,
    useDark,
    scrollbarLineColor,
    scrollbarHandleColor,
    scrollbarHeaderBackgroundColor,
    scrollbarHeaderTextColor,
} from '../utils/color';
import { getFilteredSongs, getHeaderedSongs } from '../utils/filtering';
import getSortedSongsAndRedirects from '../utils/sorting';
import Loading from './Loading';
import NoResults from './NoResults';
import { IconButton, Searchbar, TextInput } from 'react-native-paper';

export default function SearchScreen () {
    const dark = useDark();
    const listRef = useRef<FlatListQuickScroll<any>>(null);
    const songs = useSelector((state: RootState) => state.songs);
    const searchText = useSelector((state: RootState) => state.transient.searchText);
    const phonetic = useSelector((state: RootState) => state.phoneticMode);

    const sortedEntries = getSortedSongsAndRedirects(songs, phonetic);

    if (sortedEntries.length === 0) {
        return <Loading includeLogo={true} />;
    }

    const filteredSortedEntries = getFilteredSongs(sortedEntries, searchText);
    const headeredSongs = getHeaderedSongs(filteredSortedEntries);

    const body =
        headeredSongs.length === 0 ? (
            <NoResults />
        ) : (
            <View style={{ flex: 1 }}>
                <FlatListQuickScroll
                    ref={listRef}
                    data={headeredSongs}
                    renderItem={_renderListItem}
                    context={mainScrollContext}
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

    return (
        <View style={{ flex: 1, backgroundColor: backgroundColorMainView(dark) }}>
            <SearchBar listRef={listRef} />
            {body}
        </View>
    );
}

function SearchBar (props: { listRef: React.RefObject<FlatListQuickScroll<any> | null> }) {
    const dark = useDark();
    const [text, setText] = React.useState<string>('');
    const ref = useRef<ReactNativeTextInput>(null);
    const keyboardVisible = useRef(false);
    return (
        <Searchbar
            placeholder='Search / Пошук'
            value={text}
            onChangeText={(text: string) => {
                _updateText(props.listRef, text, setText);
            }}
            clearButtonMode='always'
            onClearIconPress={() => {
                _updateText(props.listRef, '', setText);
                Keyboard.dismiss();
            }}
        />
    );
}

const _updateText = (
    listRef: React.RefObject<FlatListQuickScroll<any> | null>,
    text: string,
    setText: React.Dispatch<React.SetStateAction<string>>,
) => {
    // Immediately update text in the textArea
    setText(text);
    const dispatchUpdateSearchText = () => {
        store.dispatch({ type: updateSearchText.toString(), payload: text });
    };
    if (listRef.current === null) {
        // If listRef is null then the scroll container is gone and we can't wait for it
        // Just update the text
        dispatchUpdateSearchText();
    } else {
        // Scroll to top and WAIT FOR IT TO GET THERE before actually filtering the content
        // If we don't wait, then the store dispatch interrupts the scrollToTop() -_-
        listRef.current?.scrollToTop().then(_success => {
            dispatchUpdateSearchText();
        });
    }
};

export const _renderListItem = (data: FLQSListItemProcessed<any>) => {
    return <ListItem item={data} />;
};

const mainScrollContext = new ScrollContextHelper('main_scroll');
