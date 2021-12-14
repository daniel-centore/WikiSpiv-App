import React, { Component, ReactNode } from 'react';
import PropTypes from 'prop-types';
import {
    View,
    PanResponder,
    ViewProps,
    GestureResponderEvent,
    PanResponderGestureState,
    ScrollView,
    LayoutChangeEvent,
    OpaqueColorValue
} from 'react-native';
import { store, updateZoom } from "../store/store";
// @ts-ignore
import MatrixMath from 'react-native/Libraries/Utilities/MatrixMath';
import { Unsubscribe } from 'redux';


interface IProps extends ViewProps {
    minScale: number,
    maxScale: number,
    backgroundColor?: string | OpaqueColorValue | undefined,
}

interface IState extends ViewProps {
    scale: number,
    childrenWidth: number,
    childrenHeight: number,
    fullWidth: number,
    fullHeight: number,
    forceChildrenLayout: number,
}

// Based on https://github.com/GuoChen-WHU/react-native-pinch-zoom-view/blob/master/index.js

export default class ZoomableView extends Component<IProps, IState> {

    // The default height and width of the container, which is defined to be
    // so absurdly large that the children will never be larger and the container
    // can then be immediately resized to the children
    DEFAULT_SIZE = 1000000;

    static defaultProps = {
        minScale: 0.5,
        maxScale: 2
    };

    gestureHandlers: any;
    startDistance: number;
    lastScale: React.MutableRefObject<number | null>;
    unsubscribe = null as Unsubscribe | null;

    // Kludge for working around rounding errors in iOS
    // This would cause a cascading effect where a slight decrease in size
    // would cause children recomputation which would cause 
    static EPISON = 1;

    constructor(props: IProps) {
        super(props);
        this.state = {
            scale: store.getState().zoomScale,
            childrenWidth: this.DEFAULT_SIZE,
            childrenHeight: this.DEFAULT_SIZE,
            fullWidth: this.DEFAULT_SIZE,
            fullHeight: this.DEFAULT_SIZE,
            forceChildrenLayout: 0,
        };

        this.lastScale = React.createRef();
        this.lastScale.current = store.getState().zoomScale;

        this.startDistance = 0;
        this.gestureHandlers = PanResponder.create({
            onStartShouldSetPanResponder: this._handleStartShouldSetPanResponder,
            onMoveShouldSetPanResponder: this._handleMoveShouldSetPanResponder,
            onPanResponderStart: this._handlePanResponderStart,
            onPanResponderGrant: this._handlePanResponderStart,
            onPanResponderMove: this._handlePanResponderMove,
            onPanResponderRelease: this._handlePanResponderEnd,
            onPanResponderTerminationRequest: evt => true,
            onShouldBlockNativeResponder: evt => false,
        });
        this.unsubscribe = store.subscribe(() => {
            const scale = store.getState().zoomScale;
            if (scale !== this.state.scale) {
                this.setState({
                    ...this.state,
                    scale: scale,
                });
            }
        });
    }

    componentDidMount() {
    }

    componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    _handleStartShouldSetPanResponder = (
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
    ) => {
        // don't respond to single touch to avoid shielding click on child components
        return false;
    };

    _handleMoveShouldSetPanResponder = (
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
    ) => {
        return gestureState.numberActiveTouches === 2;
    };

    _handlePanResponderStart = (
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
    ) => {
        if (gestureState.numberActiveTouches === 2) {
            let dx = Math.abs(
                e.nativeEvent.touches[0].pageX - e.nativeEvent.touches[1].pageX
            );
            let dy = Math.abs(
                e.nativeEvent.touches[0].pageY - e.nativeEvent.touches[1].pageY
            );
            this.startDistance = Math.sqrt(dx * dx + dy * dy);
            e.preventDefault();
            e.stopPropagation();
        }
    };

    _handlePanResponderEnd = (
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
    ) => {
        this.lastScale.current = this.state.scale;
        store.dispatch({ type: updateZoom, payload: this.state.scale })
    };

    _handlePanResponderMove = (
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
    ) => {
        // zoom
        if (gestureState.numberActiveTouches === 2) {
            let dx = Math.abs(
                e.nativeEvent.touches[0].pageX - e.nativeEvent.touches[1].pageX
            );
            let dy = Math.abs(
                e.nativeEvent.touches[0].pageY - e.nativeEvent.touches[1].pageY
            );
            let distance = Math.sqrt(dx * dx + dy * dy);
            let scale = (distance / this.startDistance) * (this.lastScale.current ?? 1);
            if (scale < this.props.maxScale && scale > this.props.minScale) {
                this.setState({
                    ...this.state,
                    scale: scale,
                });
            }
            e.preventDefault();
            e.stopPropagation();
        }
    };

    _childrenOnLayout = (event: LayoutChangeEvent) => {
        //
        // == Kinda gross code ahead ==
        //
        // If the size increases, that could mean that, e.g., a line of text has gotten
        // longer and because of the small container, it wrapped. By resetting the view
        // size to very large, it gives it the opportunity to shrink back down to the
        // "right" size again without any wrapping.
        //
        // Long term we should build a better container unit which doesn't have
        // any bounds to cause wrapping. For now we'll continue using the ScrollViews.
        //
        // Switching "Циганочка морганочка" or "А до мене Яків приходив"
        // between non-phonetic and phonetic is a good test case for this
        //
        const EPSILON = 1;
        let width = event.nativeEvent.layout.width;
        let height = event.nativeEvent.layout.height;
        let forceChildrenLayout = this.state.forceChildrenLayout;
        if (event.nativeEvent.layout.height > this.state.childrenHeight + EPSILON
            || event.nativeEvent.layout.width > this.state.childrenWidth + EPSILON) {
            width = this.DEFAULT_SIZE;
            height = this.DEFAULT_SIZE;

            // This is necessary so if the container size increase doesn't trigger
            // _childrenOnLayout to run again (i.e. if this was a false alarm) it
            // forces it to trigger anyways. Otherwise we end up with an ENORMOUS container.
            forceChildrenLayout++;
        }

        this.setState({
            ...this.state,
            childrenWidth: width,
            childrenHeight: height,
            forceChildrenLayout,
        });
    }

    _wrapperOnLayout = (event: LayoutChangeEvent) => {
        this.setState({
            ...this.state,
            fullWidth: event.nativeEvent.layout.width,
            fullHeight: event.nativeEvent.layout.height,
        })
    }

    render() {
        const state = this.state;
        const scale = state.scale;

        const innerWidth = Math.max(state.childrenWidth * scale, state.fullWidth);
        const innerHeight = Math.max((state.childrenHeight * scale), state.fullHeight);

        return (
            <View
                {...this.gestureHandlers.panHandlers}
                onLayout={this._wrapperOnLayout}
                style={{
                    backgroundColor: this.props.backgroundColor,
                    flex: 1,
                }}
            >
                <this.BidirectionalScrollview>
                    <View
                        style={{
                            height: innerHeight,
                            width: innerWidth,
                            minHeight: innerHeight,
                            minWidth: innerWidth,
                        }}
                    >
                        <View
                            style={[
                                this.props.style,
                                {
                                    height: state.childrenHeight + ZoomableView.EPISON,
                                    width: state.childrenWidth + ZoomableView.EPISON,
                                    backgroundColor: this.props.backgroundColor,
                                    transform: [
                                        {
                                            matrix: this._transformScale(
                                                scale,
                                                state.childrenWidth,
                                                state.childrenHeight,
                                            ),
                                        }
                                    ],
                                }]}
                        >
                            <View
                                key={'children_'+state.forceChildrenLayout}
                                onLayout={this._childrenOnLayout}
                                style={{
                                    alignSelf: 'flex-start',
                                    // backgroundColor: 'rgb(0,0,255)',
                                    backgroundColor: this.props.backgroundColor,
                                }}
                            >
                                {this.props.children}
                            </View>
                        </View>
                    </View>
                </this.BidirectionalScrollview>
            </View>
        );
    }

    BidirectionalScrollview(props: { children: ReactNode }) {
        // TODO: Come up with something better than this, might need native code. Panning
        //       only works horizontally or vertically, not diagonally, with this, which
        //       feels kind of crappy. Good enough for MVP though.
        return (
            <ScrollView directionalLockEnabled>
                <ScrollView horizontal nestedScrollEnabled directionalLockEnabled>
                    {props.children}
                </ScrollView>
            </ScrollView>
        );
    }

    // Based on https://stackoverflow.com/a/56801836/998251
    _transformScale(scaleBy: number, width: number, height: number) {
        const matrix = MatrixMath.createIdentityMatrix();
        const toScale = this._getScale(scaleBy);

        this._transformOrigin(matrix, {
            x: (width * scaleBy - width) / 2,
            y: (height * scaleBy - height) / 2,
            z: 0
        });

        MatrixMath.multiplyInto(matrix, matrix, toScale);
        return matrix;
    }

    _getScale(x: number) {
        return [
            x, 0, 0, 0,
            0, x, 0, 0,
            0, 0, x, 0,
            0, 0, 0, 1
        ];
    }

    _transformOrigin(matrix: any, origin: { x: number, y: number, z: number }) {
        const { x, y, z } = origin;

        const translate = MatrixMath.createIdentityMatrix();
        MatrixMath.reuseTranslate3dCommand(translate, x, y, z);
        MatrixMath.multiplyInto(matrix, translate, matrix);
    }

}
