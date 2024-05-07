import React, { RefObject, useEffect, useMemo, useRef, useState } from "react";
import {
    Dimensions,
    LayoutChangeEvent,
    LayoutRectangle,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollViewProps,
    View
} from "react-native";

import { RecyclerListView, DataProvider, LayoutProvider, BaseDataProvider } from "recyclerlistview";
import ScrollBar from "./ScrollBar";
import ScrollContextHelper from "../ScrollContextHelper";
import { HeaderTrackingStyle } from "./HeaderTrackingStyle";

export type FLQSListItem<ItemT> = {
    height: number,
    isHeader: boolean,
    data: ItemT,
    element_key: string,
    modification_key: string,
    headerText?: string,  // only used for the scrollbar helper
};
export type FLQSListRenderItem<ItemT> =
    (info: FLQSListItemProcessed<ItemT>) => React.ReactElement | null;

export type FLQSListItemProcessed<ItemT> = FLQSListItem<ItemT> & {
    offset: number,
};

export interface FlatListQuickScrollProps<ItemT> {
    data: ReadonlyArray<FLQSListItem<ItemT>>,
    renderItem: FLQSListRenderItem<ItemT>,
    width?: number,
    context?: ScrollContextHelper,
    // The maximum jump in px within a single render cycle. If the scrollbar
    // is dragged faster than this, we don't refresh the list UI in order to
    // keep the scrollbar dragging performant
    maxRefreshSpeed?: number,
    headerTrackingStyle?: HeaderTrackingStyle,
    scrollViewProps?: ScrollViewProps,
    scrollLineColor?: string,
    scrollHandleColor?: string,
    scrollHeaderBackgroundColor?: string,
    scrollHeaderTextColor?: string,
}

interface IState<ItemT> {
    contentSize: number,
    scrollViewLayout: LayoutRectangle | null,
    dataProvider: BaseDataProvider,
    layoutProvider: LayoutProvider,
    parsedData: FLQSListItemProcessed<ItemT>[],
}

export default class FlatListQuickScroll<ItemT>
    extends React.Component<FlatListQuickScrollProps<ItemT>, IState<ItemT>> {

    scrollBarRef: React.RefObject<ScrollBar<any>>;
    listRef: React.RefObject<RecyclerListView<any, any>>;
    latestParsedData: React.MutableRefObject<FLQSListItemProcessed<ItemT>[] | null>;

    static getParsedData<ItemT>(data: ReadonlyArray<FLQSListItem<ItemT>>) {
        return data.map((item, index) => {
            const offset = data.reduce((prev, cur, idx) => {
                if (idx < index) {
                    return prev + cur.height;
                }
                return prev;
            }, 0);
            return {
                ...item,
                offset: offset
            } as FLQSListItemProcessed<ItemT>;
        });
    }

    static getParsedState<ItemT>(
        data: ReadonlyArray<FLQSListItem<ItemT>>,
        width: number,
        latestParsedData: React.MutableRefObject<FLQSListItemProcessed<ItemT>[] | null>,
    ) {
        // Precompute offsets
        const newParsedData = FlatListQuickScroll.getParsedData(data);
        return {
            dataProvider: new DataProvider(
                (r1: FLQSListItemProcessed<ItemT>, r2: FLQSListItemProcessed<ItemT>) => {
                    return r1.modification_key !== r2.modification_key;
                },
                (index: number) => {
                    const parsedData = latestParsedData.current;
                    if (parsedData === null) {
                        return 'null';
                    }
                    // RecyclerListView sometimes gets upset when the index changes,
                    // we'll just treat it as a "new" element in that case
                    return parsedData[index].element_key + "|" + index;
                }
            ).cloneWithRows(newParsedData),
            layoutProvider: new LayoutProvider(
                index => {
                    const parsedData = latestParsedData.current;
                    if (parsedData === null) {
                        return 'null';
                    }
                    return parsedData[index].height;
                },
                (type, dim) => {
                    dim.width = width;
                    dim.height = type as number;
                }
            ),
            parsedData: newParsedData,
        };
    }

    constructor(props: FlatListQuickScrollProps<ItemT>) {
        super(props);

        this.latestParsedData = React.createRef();

        // console.log('Initializing quick scroll');

        this.scrollBarRef = React.createRef();
        this.listRef = React.createRef();

        const width = this.props.width ?? Dimensions.get("window").width;

        this.state = {
            contentSize: 0,
            scrollViewLayout: null,
            ...FlatListQuickScroll.getParsedState(props.data, width, this.latestParsedData),
        }
    }

    static getDerivedStateFromProps<ItemT>(props: FlatListQuickScrollProps<ItemT>, state: IState<ItemT>): IState<ItemT> {
        const width = props.width ?? Dimensions.get("window").width;
        const parsedData = FlatListQuickScroll.getParsedData(props.data);
        return {
            ...state,
            dataProvider: state.dataProvider.cloneWithRows(parsedData),  // We need to clone this for perf reasons
            parsedData: parsedData,
        }
    }

    // Scrolls to top and returns a promise which waits until the scroll is complete
    scrollToTop(): Promise<boolean> {
        const listRef = this.listRef;
        listRef.current?.scrollToTop();

        // Yes this is horrible, shh
        return new Promise(function (resolve, reject) {
            (function wait() {
                if (listRef.current?.getCurrentScrollOffset() === 0) {
                    return resolve(true);
                }
                setTimeout(wait, 10);
            })();
        });
    }

    rowRenderer = (type: number | string, data: FLQSListItemProcessed<ItemT>) => {
        return this.props.renderItem(data);
    }

    render() {
        const props = this.props;
        const state = this.state;

        this.latestParsedData.current = state.parsedData;

        const parsedData = state.parsedData;
        const dataProvider = state.dataProvider;
        const layoutProvider = state.layoutProvider;

        // console.log('Through to the render');
        return (
            <View style={{ flex: 1 }}>
                {
                    !state.scrollViewLayout
                        ? null
                        : <ScrollBar
                            ref={this.scrollBarRef}
                            parsedData={parsedData}
                            listRef={this.listRef}
                            contentSize={state.contentSize}
                            maxRefreshSpeed={props.maxRefreshSpeed ?? 100}
                            headerTrackingStyle={props.headerTrackingStyle}
                            scrollViewLayout={state.scrollViewLayout}
                            lineColor={props.scrollLineColor}
                            handleColor={props.scrollHandleColor}
                            headerBackgroundColor={props.scrollHeaderBackgroundColor}
                            headerTextColor={props.scrollHeaderTextColor}
                        />
                }

                <RecyclerListView
                    ref={this.listRef}
                    rowRenderer={this.rowRenderer}
                    dataProvider={dataProvider}
                    layoutProvider={layoutProvider}
                    onScroll={(
                        _rawEvent: NativeSyntheticEvent<NativeScrollEvent>,
                        _offsetX: number,
                        offsetY: number
                    ) => {
                        // Setting state on the scrollbar instead of passing a prop to avoid
                        // re-rendering the RecyclerListView too
                        this.scrollBarRef.current?.setState({
                            ...this.scrollBarRef.current?.state,
                            contentOffset: offsetY,
                        });

                        this.scrollBarRef.current?.updateJustScrolled();
                    }}
                    onContentSizeChange={(_width: number, height: number) => {
                        this.setState({
                            ...state,
                            contentSize: height,
                        })
                    }}
                    onLayout={(e: LayoutChangeEvent) => {
                        this.setState({
                            ...state,
                            scrollViewLayout: e.nativeEvent.layout,
                        });
                    }}
                    showsVerticalScrollIndicator={false}
                    contextProvider={props.context}
                    scrollViewProps={props.scrollViewProps ?? undefined}
                />
            </View>
        );
    }
}
