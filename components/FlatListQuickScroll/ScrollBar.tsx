import React from 'react';
import { Animated, PanResponder, View, Text, PanResponderGestureState, LayoutRectangle } from 'react-native';
import { RecyclerListView } from 'recyclerlistview';
import { shallowCompare } from '../../utils/simpleUtils';
import { FLQSListItemProcessed } from './FlatListQuickScroll';
import { HeaderTrackingStyle } from './HeaderTrackingStyle';

/**
 * Future work:
 *  - Allow grabbing the bar instead of naively jumping where the finger is
 *  - Make the header fade in and out nicely when pressing and releasing
 */

interface IProps<ItemT> {
    parsedData: ReadonlyArray<FLQSListItemProcessed<ItemT>>;
    listRef: React.RefObject<RecyclerListView<any, any> | null>;
    contentSize: number;
    maxRefreshSpeed: number;
    headerTrackingStyle?: HeaderTrackingStyle;
    scrollViewLayout: LayoutRectangle;
    lineColor?: string;
    handleColor?: string;
    headerBackgroundColor?: string;
    headerTextColor?: string;
}

interface IState {
    // Just for debugging
    onPanResponderMove: number;
    onPanResponderRelease: number;

    contentOffset: number;
    scrollBarLayout: LayoutRectangle | null;
    
    scrollBarDragPercent: number;
    // Using this kludge to prevent the scrollbar from jumping back to
    // its old position briefly upon being released
    contentOffsetStaleValueKludge: number;
    scrollbarOpacity: Animated.Value;
}

export default class ScrollBar<ItemT> extends React.Component<IProps<ItemT>, IState> {
    nubTimerHandle: NodeJS.Timeout | null;
    scrollbarVisible: boolean;
    // NOTE: usingScrollBar needed to be moved out of the state to fix a race condition
    // which was causing the state to not be updated correctly sometimes when updated
    // quickly from the PanResponder. In theory the other state variables are probably
    // impacted too and should perhaps be moved out of the state too (TODO)
    usingScrollBar: boolean;
    scrollBarRef = React.createRef<View>();

    constructor (props: IProps<ItemT>) {
        super(props);
        this.state = {
            onPanResponderMove: 0,
            onPanResponderRelease: 0,

            contentOffset: 0,
            scrollBarLayout: null,
            scrollBarDragPercent: 0,
            contentOffsetStaleValueKludge: -1,
            scrollbarOpacity: new Animated.Value(0),
        };
        this.nubTimerHandle = null;
        this.scrollbarVisible = false;
        this.usingScrollBar = false;
    }

    _stayVisible () {
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

    updateJustScrolled () {
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

    _computeDragPercent (gestureState: PanResponderGestureState): number | null {
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

    _computeDragOffset (positionPercent: number): number {
        const props = this.props;
        const state = this.state;
        return Math.min(
            Math.max((props.contentSize - (state.scrollBarLayout?.height ?? 0)) * positionPercent, 0),
            props.contentSize,
        );
    }

    _fixScreenLayout () {
        this.scrollBarRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
            const currentLayout = this.state.scrollBarLayout;

            const newLayout = new (class implements LayoutRectangle {
                x = pageX;
                y = pageY;
                width = width;
                height = height;
            })();
            if (height !== undefined && !shallowCompare(currentLayout, newLayout)) {
                this.setState(state => {
                    // console.log('_fixScreenLayout', { state });
                    return {
                        ...state,
                        scrollBarLayout: newLayout,
                    };
                });
            }
        });
    }

    _clearTimers () {
        if (this.nubTimerHandle) {
            clearTimeout(this.nubTimerHandle);
            this.nubTimerHandle = null;
        }
    }

    componentWillUnmount = () => {
        // console.log('componentWillUnmount');
        this._clearTimers();
    };

    panResponder = PanResponder.create({
        onPanResponderRelease: (evt, gestureState) => {
            // console.log('RELEASE');
            const props = this.props;

            if (!this.scrollbarVisible) {
                // console.log('!this.scrollbarVisible2');
                // If scrollbar is not visible just swallow its move requests
                return;
            }

            const positionPercent = this._computeDragPercent(gestureState);
            if (positionPercent === null) {
                // console.log('!positionPercent');
                return;
            }
            const offset = this._computeDragOffset(positionPercent);

            props.listRef.current?.scrollToOffset(
                0, // x
                offset, // y
                // Animation is required here because otherwise a gesture with momentum (i.e. a "fling")
                // followed by tapping on the scrollbar only jumps briefly to the correct position, then
                // finishes the original gesture. This seems to trick it into not doing that. Would prefer
                // an alternate workaround which cancelled the existing "fling" handling, but couldn't
                // find an easy way to do that.
                true, // animation
            );

            // TODO: Move away from state and use forceUpdate instead? To fix race condition?
            this.setState(state => {
                // console.log('onPanResponderRelease', { state });
                return {
                    ...state,
                    onPanResponderRelease: state.onPanResponderRelease + 1,
                    scrollBarDragPercent: positionPercent,
                    contentOffsetStaleValueKludge: state.contentOffset,
                };
            });
            this.usingScrollBar = false;

            // console.log('Just Scrolled');
            this.updateJustScrolled();
            this.forceUpdate();
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
                    0, // x
                    offset, // y
                    false, // animation
                );
            }

            // console.log('onPanResponderMove - using scrollbar!');
            this.setState(state => {
                // console.log('onPanResponderMove', { state });
                return {
                    ...state,
                    onPanResponderMove: state.onPanResponderMove + 1,
                    scrollBarDragPercent: positionPercent,
                    contentOffset: offset,
                };
            });
            this.usingScrollBar = true;

            this.updateJustScrolled();
        },
        onPanResponderTerminationRequest: () => true,
        onMoveShouldSetPanResponder: (evt, gestureState) => {
            return true;
        },
    });

    render () {
        // _fixScreenLayout must be run frequently because sometimes the onLayout is a little eager
        // and runs before "measure" is ready to work correctly, and we end up with stale or
        // undefined values, so this helps us only be wrong for an imperceptible amount of time instead
        // of getting stuck that way
        // EDIT: Not able to repro this issue anymore, and latest version of React freaks out when
        // setting state from render.
        // this._fixScreenLayout();

        const props = this.props;
        const state = this.state;

        // console.log('\n\n === RENDER', {
        //     usingScrollbar: this.usingScrollBar,
        //     onPanResponderMove: state.onPanResponderMove,
        //     onPanResponderRelease: state.onPanResponderRelease,
        // });

        const scrollBarBorderRadius = 6;

        // TODO:
        // * Adjust size based on amount of content
        // * Adjustable minimum size
        const scrollBarHeight = 60;
        const tapWidth = 40;
        const barWidth = 6;
        const nubWidth = 10;

        const scrollPercent = Math.min(
            Math.max(
                this.usingScrollBar || state.contentOffsetStaleValueKludge === state.contentOffset
                    ? state.scrollBarDragPercent
                    : state.contentOffset / (props.contentSize - props.scrollViewLayout.height),
                0,
            ),
            1,
        );

        // console.log('Percent: ' + (scrollPercent * 100) + '%'
        //     + ' Content offset: ' + state.contentOffset
        //     + ' content size: ' + props.contentSize
        //     + ' Layout height: ' + props.scrollViewLayout.height
        //     + ' Denom: ' + (props.contentSize - props.scrollViewLayout.height)
        // );

        let comparison = 0;
        switch (props.headerTrackingStyle) {
            case HeaderTrackingStyle.PROPORTIONAL:
                comparison = Math.min(Math.max(props.contentSize * scrollPercent, 0), props.contentSize);
                break;
            case HeaderTrackingStyle.TOP:
                comparison = Math.min(
                    Math.max(scrollPercent * (props.contentSize - (state.scrollBarLayout?.height ?? 0)), 0),
                    props.contentSize,
                );
                break;
            case HeaderTrackingStyle.BOTTOM:
            default:
                comparison = Math.min(
                    Math.max(
                        scrollPercent * (props.contentSize - (state.scrollBarLayout?.height ?? 0)) +
                            (state.scrollBarLayout?.height ?? 0),
                        0,
                    ),
                    props.contentSize,
                );
                break;
        }
        // if (props.headerTrackingStyle === HeaderTrackingStyle.TOP || props.headerTrackingStyle === undefined)

        const headerData = Array(...props.parsedData)
            .reverse()
            .find(
                item =>
                    item.isHeader &&
                    item.headerText !== undefined &&
                    item.headerText !== null &&
                    item.offset <= comparison,
            );

        // || 0 needed to ignore the NaN we get at start
        const scrollBarTop = Math.max(scrollPercent * ((state.scrollBarLayout?.height ?? 0) - scrollBarHeight), 0) || 0;
        const header =
            headerData === undefined ? null : (
                <View
                    style={{
                        position: 'absolute',
                        right: tapWidth / 2 - barWidth / 2 + 40,
                        width: 100,
                        height: 100,
                        top: scrollBarTop - 100 / 2 + scrollBarHeight / 2,
                        borderRadius: scrollBarBorderRadius,
                        backgroundColor: props.headerBackgroundColor ?? 'rgba(0,0,0,.5)',
                        zIndex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Text
                        style={{
                            fontSize: 26,
                            color: props.headerTextColor ?? 'rgba(255,255,255,1)',
                            fontWeight: 'bold',
                        }}
                    >
                        {headerData.headerText ?? 'ERROR'}
                    </Text>
                </View>
            );

        const headerView = <Animated.View>{this.usingScrollBar ? header : null}</Animated.View>;

        const mainView = (
            <View
                ref={this.scrollBarRef}
                style={{
                    position: 'absolute',
                    right: 0,
                    top: '5%',
                    marginBottom: 8,
                    width: tapWidth,
                    height: '90%',
                    borderRadius: scrollBarBorderRadius,
                    backgroundColor: 'rgba(255,255,255,0)',
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
                {/* The line */}
                <Animated.View
                    style={{
                        opacity: this.state.scrollbarOpacity,
                        position: 'absolute',
                        right: tapWidth / 2 - barWidth / 2,
                        marginBottom: 8,
                        width: barWidth,
                        height: '100%',
                        borderRadius: scrollBarBorderRadius,
                        backgroundColor: props.lineColor ?? 'rgba(0,0,0,0.5)',
                        zIndex: 1,
                    }}
                />
                {/* The scrollbar handle */}
                <Animated.View style={[{ opacity: this.state.scrollbarOpacity }]}>
                    <View
                        style={{
                            position: 'absolute',
                            right: tapWidth / 2 - nubWidth / 2,
                            top: scrollBarTop,
                            marginBottom: 8,
                            width: nubWidth,
                            height: scrollBarHeight,
                            borderRadius: scrollBarBorderRadius + 2,
                            backgroundColor: props.handleColor ?? 'rgba(0,0,0,1)',
                        }}
                    />
                </Animated.View>
            </View>
        );

        return (
            <View
                style={{
                    position: 'absolute',
                    right: 0,
                    // The scrollbar needs to grow when it's being used so the header is visible
                    // It can't always be full width though because then it consumes tap events when it shouldn't
                    width: this.usingScrollBar ? '100%' : tapWidth,
                    height: '100%',
                    zIndex: 1,
                }}
            >
                {mainView}
                <View style={{ top: '5%' }}>{headerView}</View>
            </View>
        );
    }
}
