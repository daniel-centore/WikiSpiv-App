import { MaterialIcons } from "@expo/vector-icons";
import { Icon, Input } from "native-base";
import React, { useEffect, useRef } from "react";
import { GestureResponderEvent, Keyboard, Platform, Pressable, TextInput, View } from "react-native";
import { useSelector } from "react-redux";
import FlatListQuickScroll, { FLQSListItemProcessed } from "../components/FlatListQuickScroll/FlatListQuickScroll";
import ListItem from "../components/ListItem";
import ScrollContextHelper from "../components/ScrollContextHelper";
import { RootState, store, updateSearchText } from "../store/store";
import {
    backgroundColorMainView,
    useDark,
    textColorPrimary,
    textColorSecondary,
    backgroundColorSearchBar,
    scrollbarLineColor,
    scrollbarHandleColor,
    scrollbarHeaderBackgroundColor,
    scrollbarHeaderTextColor,
} from "../utils/color";
import { getFilteredSongs, getHeaderedSongs } from "../utils/filtering";
import getSortedSongsAndRedirects from "../utils/sorting";
import Loading from "./Loading";
import NoResults from "./NoResults";

export default function SearchScreen() {
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

    const body = headeredSongs.length === 0
        ? (<NoResults />)
        : (
            <View style={{ flex: 1 }}>
                <FlatListQuickScroll
                    ref={listRef}
                    data={headeredSongs}
                    renderItem={_renderListItem}
                    context={mainScrollContext}
                    scrollViewProps={{
                        keyboardShouldPersistTaps: "handled",
                    }}
                    scrollLineColor={scrollbarLineColor(dark)}
                    scrollHandleColor={scrollbarHandleColor(dark)}
                    scrollHeaderBackgroundColor={scrollbarHeaderBackgroundColor(dark)}
                    scrollHeaderTextColor={scrollbarHeaderTextColor(dark)}
                />
            </View>
        );

    // console.log(headeredSongs);
    return <View style={{ flex: 1, backgroundColor: backgroundColorMainView(dark) }}>
        <SearchBar listRef={listRef} />
        {body}
    </View>;
}

function SearchBar(props: { listRef: React.RefObject<FlatListQuickScroll<any>> }) {
    const dark = useDark();
    const [text, setText] = React.useState<string>('');
    const ref = useRef<TextInput>(null);
    const keyboardVisible = useRef(false);
    useEffect(() => {
        // Blur input when keyboard closes (e.g. after tapping back arrow)
        //
        // iOS doesn't need to do this because we have no way of dismissing the keyboard
        // anyways (because no back button) and this causes funky behavior in the
        // ios simulator (which triggers the keyboardDidHide command immediately
        // after focusing because the display keyboard was "hidden")
        const hideListener = Keyboard.addListener('keyboardDidHide', (event) => {
            if (Platform.OS === 'android') {
                ref.current?.blur();
            }
        });
        return () => {
            hideListener.remove();
        }
    }, [])
    return (
        <Input
            ref={ref}
            value={text}
            onChangeText={(text: string) => {
                _updateText(props.listRef, text, setText);
            }}
            placeholder="Search / Пошук"
            color={textColorPrimary(dark)}
            borderColor={backgroundColorSearchBar(dark)}
            backgroundColor={backgroundColorSearchBar(dark)}
            placeholderTextColor={textColorSecondary(dark)}
            selectionColor={textColorPrimary(dark)}
            borderWidth={0}
            width="100%"
            borderRadius="4"
            py="4"
            px="1"
            fontSize="15"
            InputLeftElement={
                <Icon
                    m="2"
                    ml="3"
                    size="6"
                    color={textColorPrimary(dark)}
                    as={<MaterialIcons name="search" />}
                />
            }
            InputRightElement={
                <Pressable
                    onPress={(event: GestureResponderEvent) => {
                        _updateText(props.listRef, '', setText);
                        Keyboard.dismiss();
                    }}
                >
                    <Icon
                        m="2"
                        mr="3"
                        size="6"
                        color={textColorPrimary(dark)}
                        as={<MaterialIcons name="close" />}
                    />
                </Pressable>
            }
        />
    );
}

const _updateText = (
    listRef: React.RefObject<FlatListQuickScroll<any>>,
    text: string,
    setText: React.Dispatch<React.SetStateAction<string>>
) => {
    // Immediately update text in the textArea
    setText(text);
    const dispatchUpdateSearchText = () => { store.dispatch({ type: updateSearchText, payload: text }); };
    if (listRef.current === null) {
        // If listRef is null then the scroll container is gone and we can't wait for it
        // Just update the text
        dispatchUpdateSearchText();
    } else {
        // Scroll to top and WAIT FOR IT TO GET THERE before actually filtering the content
        // If we don't wait, then the store dispatch interrupts the scrollToTop() -_-
        listRef.current?.scrollToTop().then((_success) => {
            dispatchUpdateSearchText();
        });
    }
}

export const _renderListItem = (data: FLQSListItemProcessed<any>) => {
    return <ListItem item={data} />;
};

const mainScrollContext = new ScrollContextHelper('main_scroll');