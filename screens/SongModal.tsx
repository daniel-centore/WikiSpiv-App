import React from "react";
import {
    Appearance,
    ScrollView,
    View
} from "react-native";
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { StackParamList } from "../App";
import { RootState, store } from "../store/store";
import Song from "../interfaces/Song";
import { getLatestSong } from "../utils/wikispivUtils";
import Loading from "./Loading";
import ZoomableView from "../components/ZoomableView";
import SongError from "./SongError";
import SongWrapper from "../interfaces/SongWrapper";
import SongView from "../components/SongView";
import { backgroundColorPrimary, useDark } from "../utils/color";
import { Unsubscribe } from "redux";
import { useKeepAwake } from 'expo-keep-awake';
import TranspositionToolbar from "../components/TranspositionToolbar";
import { useSelector } from "react-redux";
import { ChordModeSetting } from "../store/SettingEnums";

interface IProps {
    navigation: StackNavigationProp<any>,
    route: RouteProp<StackParamList, 'song'>,
}

interface IPropsWithDark extends IProps {
    dark: boolean,
    showChord: boolean,
}

interface IState {
    song: Song,
}

class SongModalImpl extends React.Component<IPropsWithDark, IState> {

    unsubscribe = null as Unsubscribe | null;

    constructor(props: IPropsWithDark) {
        super(props);
        const params = props.route.params;
        const latestSong = getLatestSong(params.song) || params.song;
        this.state = {
            song: latestSong,
        };

        this.unsubscribe = store.subscribe(() => {
            const latestSong = getLatestSong(this.state.song) || this.state.song;
            if (latestSong !== this.state.song) {
                this.setState({
                    ...this.state,
                    song: latestSong,
                })
            }
        });
    }

    render() {
        const dark = this.props.dark;
        const state = this.state;

        if (!state.song.populated) {
            return (<Loading includeLogo={false} />);
        }

        const songWrapper = new SongWrapper(state.song);
        const stanzas = songWrapper.makeStanzas();
        const credits = songWrapper.getCleanCredits();
        if (stanzas === null) {
            return (<SongError />);
        }

        return (
            <View style={{ flex: 1 }}>
                <ZoomableView
                    maxScale={3}
                    minScale={0.3}
                    backgroundColor={backgroundColorPrimary(dark)}
                >
                    <View style={{
                        // Must be padding, not margin, so
                        // layout size computation inludes it
                        paddingVertical: 10,
                        paddingHorizontal: 15,
                        backgroundColor: backgroundColorPrimary(dark),
                    }}>
                        <SongView
                            dark={dark}
                            credits={credits}
                            stanzas={stanzas}
                            song={state.song}
                            showChord={this.props.showChord}
                        />
                    </View>
                </ZoomableView>
                <TranspositionToolbar song={state.song} />
            </View>
        );
    }

    _onThemeChange = () => {
        this.forceUpdate();
    }

    componentDidMount() {
        Appearance.addChangeListener(this._onThemeChange);
    }

    componentWillUnmount() {
        Appearance.removeChangeListener(this._onThemeChange);
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }
}

export default function SongModal(props: IProps) {
    const dark = useDark();
    const chordsModeSetting = useSelector((state: RootState) => state.chordsMode);
    const showChord = chordsModeSetting !== ChordModeSetting.NO_CHORDS;
    useKeepAwake();
    return <SongModalImpl {...props} dark={dark} showChord={showChord} />;
}