import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Box, Icon, Text } from "native-base";
import React, { useEffect } from "react";
import { Button, GestureResponderEvent, View } from "react-native";
import { useSelector } from "react-redux";
import Song from "../interfaces/Song";
import { RootState, store, transposeSong } from "../store/store";
import { backgroundColorSecondary, textColorPrimary, useDark } from "../utils/color";
import PressableDebounce from "./PressableDebounce";

export default function TranspositionToolbar(props: { song: Song }) {
    const dark = useDark();
    const transposition = useSelector((state: RootState) => state.transposition);

    if (!transposition) {
        return null;
    }
    return <View style={{
        paddingTop: 10,
        paddingBottom: 10,
        backgroundColor: backgroundColorSecondary(dark),
        alignItems: 'center',
        width: '100%',
    }}>
        <View style={{
            flexDirection: 'row',
        }}>
            <IconButton
                icon={<MaterialCommunityIcons name={'arrow-up-bold'} />}
                onPress={() => { transpose(props.song, -1) }}
            />
            <IconButton
                icon={<MaterialIcons name={'highlight-remove'} />}
                onPress={() => { transpose(props.song, 0) }}
            />
            <IconButton
                icon={<MaterialCommunityIcons name={'arrow-down-bold'} />}
                onPress={() => { transpose(props.song, 1) }}
            />
        </View>
        <View>
            <Text color={textColorPrimary(dark)} fontSize={14} bold={true}>
                {'Transposition / Транспозиція'}
            </Text>
        </View>
        <Box
            safeAreaBottom={true}
            backgroundColor={backgroundColorSecondary(dark)}
        />
    </View>;
}

function transpose(song: Song, offset: number) {
    const amount = offset === 0 ? 0 : (song.local?.transposition ?? 0) + offset
    store.dispatch({ type: transposeSong, payload: { song: song, amount: amount } });
}

function IconButton(props: {
    onPress: (event: GestureResponderEvent) => void,
    icon: JSX.Element,
}) {
    const dark = useDark();
    return <PressableDebounce onPress={props.onPress} debounceTime={10}>
        {({ pressed }) => (
            <View style={{
                backgroundColor: backgroundColorSecondary(dark, pressed),
                paddingHorizontal: 20,
            }}>
                <Icon
                    size="8"
                    color={textColorPrimary(dark)}
                    as={props.icon}
                />
            </View>
        )}
    </PressableDebounce>
}