import { themeTools } from "native-base";
import React, { useMemo, useRef } from "react";
import {
    Animated,
    PanResponder,
    View,
    Text,
    PanResponderGestureState,
    LayoutRectangle,
} from "react-native";
import { RecyclerListView } from "recyclerlistview";
import { shallowCompare } from "../../utils/simpleUtils";
import { FLQSListItemProcessed } from "./FlatListQuickScroll";
import { HeaderTrackingStyle } from "./HeaderTrackingStyle";

/**
 * Future work:
 *  - Allow grabbing the bar instead of naively jumping where the finger is
 *  - Make the header fade in and out nicely when pressing and releasing
 */

interface IProps<ItemT> {
    parsedData: ReadonlyArray<FLQSListItemProcessed<ItemT>>;
    listRef: React.RefObject<RecyclerListView<any, any>>;
    contentSize: number;
    maxRefreshSpeed: number;
    headerTrackingStyle?: HeaderTrackingStyle,
    scrollViewLayout: LayoutRectangle;
    lineColor?: string,
    handleColor?: string,
    headerBackgroundColor?: string,
    headerTextColor?: string,
}

interface IState {
    contentOffset: number;
    scrollBarLayout: LayoutRectangle | null,
    usingScrollBar: boolean,
    scrollBarDragPercent: number,
    // Using this kludge to prevent the scrollbar from jumping back to
    // its old position briefly upon being released
    contentOffsetStaleValueKludge: number,
    scrollbarOpacity: Animated.Value,
}

export default class ScrollBar<ItemT> extends React.Component<IProps<ItemT>, IState> {
    nubTimerHandle: NodeJS.Timeout | null;
    scrollbarVisible: boolean;
    scrollBarRef = React.createRef<View>();

    constructor(props: IProps<ItemT>) {
        super(props);
        this.state = {
            contentOffset: 0,
            scrollBarLayout: null,
            usingScrollBar: false,
            scrollBarDragPercent: 0,
            contentOffsetStaleValueKludge: -1,
            scrollbarOpacity: new Animated.Value(0),
        }
        this.nubTimerHandle = null;
        this.scrollbarVisible = false;
    }

    _stayVisible() {
        const state = this.state;

        this._clearTimers();
        this.nubTimerHandle = setTimeout(() => {
            Animated.timing(state.scrollbarOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
            }).start();
            this.nubTimerHandle = null;
            this.scrollbarVisible = false;
        }, 1500);
    }

    updateJustScrolled() {
        const state = this.state;
        if (this.scrollbarVisible) {
            this._stayVisible();
        } else {
            Animated.timing(this.state.scrollbarOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
            }).start(() => {
                this._stayVisible();
                this.scrollbarVisible = true;
            });
        }
    }

    _computeDragPercent(
        gestureState: PanResponderGestureState,
    ): number | null {
        const state = this.state;
        const scrollBarLayout = state.scrollBarLayout;
        if (scrollBarLayout === null) {
            return null;
        }

        const pct = (gestureState.moveY - scrollBarLayout.y) / scrollBarLayout.height;
        // console.log('Scroll pct: ' + (pct * 100)
        //     + '% moveY: ' + gestureState.moveY
        //     + ' pY: ' + scrollBarLayout.py
        //     + ' height: ' + scrollBarLayout.height
        // );
        return pct;
    }

    _computeDragOffset(positionPercent: number): number {
        const props = this.props;
        const state = this.state;
        return Math.min(Math.max(
            (props.contentSize - (state.scrollBarLayout?.height ?? 0)) * positionPercent,
            0), props.contentSize
        );
    }

    _fixScreenLayout() {
        this.scrollBarRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
            const currentLayout = this.state.scrollBarLayout;

            const newLayout = new class implements LayoutRectangle {
                x = pageX;
                y = pageY;
                width = width;
                height = height;

            };
            if (height !== undefined && !shallowCompare(currentLayout, newLayout)) {
                this.setState({
                    ...this.state,
                    scrollBarLayout: newLayout,
                })
            }
        });
    }

    _clearTimers() {
        if (this.nubTimerHandle) {
            clearTimeout(this.nubTimerHandle);
            this.nubTimerHandle = null;
        }
    }

    componentWillUnmount = () => {
        this._clearTimers();
    };

    panResponder = PanResponder.create({
        onPanResponderRelease: (evt, gestureState) => {
            const props = this.props;
            const state = this.state;

            if (!this.scrollbarVisible) {
                // If scrollbar is not visible just swallow its move requests
                return;
            }

            const positionPercent = this._computeDragPercent(gestureState);
            if (positionPercent === null) {
                return;
            }
            const offset = this._computeDragOffset(positionPercent);

            props.listRef.current?.scrollToOffset(
                0,       // x
                offset,  // y
                // Animation is required here because otherwise a gesture with momentum (i.e. a "fling")
                // followed by tapping on the scrollbar only jumps briefly to the correct position, then
                // finishes the original gesture. This seems to trick it into not doing that. Would prefer
                // an alternate workaround which cancelled the existing "fling" handling, but couldn't
                // find an easy way to do that.
                true,    // animation
            );
            this.setState({
                ...state,
                scrollBarDragPercent: positionPercent,
                contentOffsetStaleValueKludge: state.contentOffset,
                usingScrollBar: false,
            })

            this.updateJustScrolled();
        },
        onPanResponderMove: (evt, gestureState) => {
            const props = this.props;
            const state = this.state;

            if (!this.scrollbarVisible) {
                // If scrollbar is not visible just swallow its move requests
                return;
            }

            const positionPercent = this._computeDragPercent(gestureState);
            if (positionPercent === null) {
                return;
            }
            const offset = this._computeDragOffset(positionPercent);
            const dOffset = offset - state.contentOffset;

            // Only update scroll position if the user isn't moving too fast
            // This helps prevent stuttering with the scrollbar
            if (Math.abs(dOffset) < props.maxRefreshSpeed) {
                props.listRef.current?.scrollToOffset(
                    0,       // x
                    offset,  // y
                    false,   // animation
                );
            }

            this.setState({
                ...this.state,
                scrollBarDragPercent: positionPercent,
                usingScrollBar: true,
                contentOffset: offset,
            });

            this.updateJustScrolled();
        },
        onPanResponderTerminationRequest: () => true,
        onMoveShouldSetPanResponder: (evt, gestureState) => {
            return true;
        },
    });

    render() {
        // _fixScreenLayout must be run frequently because sometimes the onLayout is a little eager
        // and runs before "measure" is ready to work correctly, and we end up with stale or
        // undefined values, so this helps us only be wrong for an imperceptible amount of time instead
        // of getting stuck that way
        this._fixScreenLayout();

        const props = this.props;
        const state = this.state;

        const scrollBarBorderRadius = 6;

        // TODO:
        // * Adjust size based on amount of content
        // * Adjustable minimum size
        const scrollBarHeight = 60;
        const tapWidth = 40;
        const barWidth = 6;
        const nubWidth = 10;

        const scrollPercent = Math.min(Math.max(
            state.usingScrollBar || (state.contentOffsetStaleValueKludge === state.contentOffset)
                ? state.scrollBarDragPercent
                : (state.contentOffset / (props.contentSize - props.scrollViewLayout.height))
            , 0), 1);

        // console.log('Percent: ' + (scrollPercent * 100) + '%'
        //     + ' Content offset: ' + state.contentOffset
        //     + ' content size: ' + props.contentSize
        //     + ' Layout height: ' + props.scrollViewLayout.height
        //     + ' Denom: ' + (props.contentSize - props.scrollViewLayout.height)
        // );

        let comparison = 0;
        switch (props.headerTrackingStyle) {
            case HeaderTrackingStyle.PROPORTIONAL:
                comparison = Math.min(Math.max(
                    props.contentSize * scrollPercent,
                    0), props.contentSize);
                break;
            case HeaderTrackingStyle.TOP:
                comparison = Math.min(Math.max(
                    scrollPercent * (props.contentSize - (state.scrollBarLayout?.height ?? 0)),
                    0), props.contentSize);;
                break;
            case HeaderTrackingStyle.BOTTOM:
            default:
                    comparison = Math.min(Math.max(
                        scrollPercent * (props.contentSize - (state.scrollBarLayout?.height ?? 0))
                        + (state.scrollBarLayout?.height ?? 0),
                        0), props.contentSize);;
                    break;
        }
        // if (props.headerTrackingStyle === HeaderTrackingStyle.TOP || props.headerTrackingStyle === undefined)

        const headerData = Array(...props.parsedData).reverse().find(
            item => item.isHeader
                && item.headerText !== undefined
                && item.headerText !== null
                && item.offset <= comparison
        );

        // || 0 needed to ignore the NaN we get at start
        const scrollBarTop = Math.max(
            scrollPercent * ((state.scrollBarLayout?.height ?? 0) - scrollBarHeight),
            0
        ) || 0;
        const header = headerData === undefined ? null : (
            <View
                style={{
                    position: "absolute",
                    right: (tapWidth / 2 - barWidth / 2 + 40),
                    width: 100,
                    height: 100,
                    top: scrollBarTop - 100 / 2 + scrollBarHeight / 2,
                    borderRadius: scrollBarBorderRadius,
                    backgroundColor: props.headerBackgroundColor ?? "rgba(0,0,0,.5)",
                    zIndex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Text
                    style={{
                        fontSize: 26,
                        color: props.headerTextColor ?? 'rgba(255,255,255,1)',
                        fontWeight: 'bold'
                    }}
                >
                    {headerData.headerText ?? 'ERROR'}
                </Text>
            </View>
        );

        return (
            <View
                ref={this.scrollBarRef}
                style={{
                    position: "absolute",
                    right: 0,
                    top: "5%",
                    marginBottom: 8,
                    width: tapWidth,
                    height: "90%",
                    borderRadius: scrollBarBorderRadius,
                    backgroundColor: "rgba(255,255,255,0)",
                    zIndex: 1,
                }}
                onLayout={e => {
                    this._fixScreenLayout();

                    // This doesn't work because layout.y is not the overall position on the screen
                    // and cannot be compared to the pointer position
                    // const layout = e.nativeEvent.layout;
                    // this.setState({
                    //     ...this.state,
                    //     scrollBarLayout: { height: layout.height, py: layout.y },
                    // })
                }}
                {...this.panResponder.panHandlers}
            >
                {/* The header */}
                <Animated.View>
                    {state.usingScrollBar ? header : null}
                </Animated.View>
                {/* The line */}
                <Animated.View
                    style={{
                        opacity: this.state.scrollbarOpacity,
                        position: "absolute",
                        right: (tapWidth / 2 - barWidth / 2),
                        marginBottom: 8,
                        width: barWidth,
                        height: "100%",
                        borderRadius: scrollBarBorderRadius,
                        backgroundColor: props.lineColor ?? 'rgba(0,0,0,0.5)',
                        zIndex: 1,
                    }}
                />
                {/* The scrollbar handle */}
                <Animated.View style={[{ opacity: this.state.scrollbarOpacity }]}>
                    <View
                        style={{
                            position: "absolute",
                            right: (tapWidth / 2 - nubWidth / 2),
                            top: scrollBarTop,
                            marginBottom: 8,
                            width: nubWidth,
                            height: scrollBarHeight,
                            borderRadius: scrollBarBorderRadius + 2,
                            backgroundColor: props.handleColor ?? "rgba(0,0,0,1)",
                        }} />
                </Animated.View>
            </View>
        );
    }
}
