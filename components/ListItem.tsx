import { View, Text } from "native-base";
import React from "react";
import { backgroundColorListHeaders, useDark, textColorListHeaders } from "../utils/color";
import { SongEntry } from "../utils/types";
import { FLQSListItem } from "./FlatListQuickScroll/FlatListQuickScroll";
import SongListItem from "./SongListItem";

type ListItemData = {
    item: FLQSListItem<string | {
        result: SongEntry,
        index: number
    }>
};

const ListItem = React.memo<ListItemData>((props) => {
    const dark = useDark();
    const item = props.item;
    if (item.isHeader) {
        return (
            <View
                style={{
                    height: item.height,
                    paddingLeft: 10,
                }}
                backgroundColor={backgroundColorListHeaders(dark)}>
                {/* TODO: Improve type of item.data */}
                <Text fontSize={22} fontWeight={'bold'} color={textColorListHeaders(dark)}>{item.data as string}</Text>
            </View>
        );
    } else {
        const data = item.data as {
            result: SongEntry,
            index: number
        };
        return <SongListItem
            song={data.result.song}
            index={data.index}
            title={data.result.title}
            height={item.height}
            isRedirect={data.result.isRedirect}
        />;
    }
}, (prevProps, nextProps) => {
    const prevItem = prevProps.item;
    const nextItem = nextProps.item;
    if (prevItem.modification_key !== nextItem.modification_key) {
        return false;
    }
    if (prevItem.isHeader) {
        return prevItem.data === nextItem.data;
    } else {
        const prevSong = (prevItem.data as { result: SongEntry, index: number }).result.song;
        const nextSong = (nextItem.data as { result: SongEntry, index: number }).result.song;
        return prevSong.populated?.populatedTime === nextSong.populated?.populatedTime;
    }
});

export default ListItem;