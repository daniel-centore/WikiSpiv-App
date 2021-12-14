import { View, Text, Select, CheckIcon, Button } from "native-base";
import React, { useRef } from "react";
import { Alert, Image, ScrollView, Switch } from 'react-native';
import SettingsRow from "../components/SettingsRow";
import { RELOAD_SONG_LIST, resetApp, RootState, store, updateDarkMode, updatePhoneticMode } from "../store/store";
import {
    backgroundColorButton,
    backgroundColorButtonWarning,
    backgroundColorPrimary,
    backgroundColorSecondary,
    backgroundColorSelected,
    switchColorThumb,
    switchColorTrack,
    textColorError,
    textColorPrimary,
    useDark,
} from "../utils/color";
import logo from '../assets/images/logo.png'
import { DarkModeSetting, PhoneticModeSetting } from "../store/SettingEnums";
import { useError } from "../utils/errorHandling";
import Constants from "expo-constants"
import { useSelector } from "react-redux";


export default function Settings() {
    const dark = useDark();
    const error = useError();
    const songs = useSelector((state: RootState) => state.songs);
    const darkModeSetting = useSelector((state: RootState) => state.darkMode);
    const phoneticModeSetting = useSelector((state: RootState) => state.phoneticMode);
    const lastUpdateTrigger = useSelector((state: RootState) => state.lastUpdateTrigger);

    const isPhoneticChecked = (phoneticModeSetting !== PhoneticModeSetting.OFF);

    const updated = songs.filter(
        s => s.populated && s.populated.populatedTime > lastUpdateTrigger
    ).length;
    const populated = songs.filter(s => s.populated?.populatedTime).length;
    const total = songs.length;
    const lastUpdatedDate = new Date(lastUpdateTrigger);
    const lastUpdatedHuman = lastUpdatedDate.toLocaleDateString() + ' ' + lastUpdatedDate.toLocaleTimeString();

    return (
        <ScrollView style={{
            backgroundColor: backgroundColorPrimary(dark),
            height: '100%',
            width: '100%',
            paddingTop: 20,
            paddingBottom: 20,
            paddingHorizontal: 10,
        }}>
            <View paddingBottom={20}>
                <View style={{
                    alignItems: 'center',
                    width: '100%',
                    paddingBottom: 15,
                }}>
                    <Image source={logo} style={{ width: 100, height: 100 }} />
                </View>
                <Text style={{
                    paddingBottom: 5,
                    textAlign: 'center',
                    color: textColorPrimary(dark),
                    fontSize: 40,
                    lineHeight: 45,
                }}>
                    {'WikiSpiv'}
                </Text>
                <Text style={{
                    paddingBottom: 20,
                    textAlign: 'center',
                    color: textColorPrimary(dark),
                    fontSize: 14,
                }}>
                    {
                        'Спільний Співаник Української Діяспори'
                        + '\nThe Collaborative Ukrainian Diaspora Spivanyk'
                        + '\n(C) Danylo Centore 2016 - ' + new Date().getFullYear()
                        + '\nv' + Constants.manifest?.version
                    }
                </Text>
                <SettingsRow title="Theme / Тема">
                    <Select
                        selectedValue={darkModeSetting}
                        minWidth="195"
                        accessibilityLabel="App theme setting"
                        placeholder="App Theme"
                        fontSize={16}
                        mt={1}
                        onValueChange={(value) => {
                            store.dispatch({ type: updateDarkMode, payload: value })
                        }}
                        backgroundColor={backgroundColorSecondary(dark)}
                        color={textColorPrimary(dark)}
                        _actionSheetContent={{
                            backgroundColor: backgroundColorPrimary(dark),

                        }}
                        _item={{
                            _text: {
                                color: textColorPrimary(dark),
                            }
                        }}
                        _selectedItem={{
                            backgroundColor: backgroundColorSelected(dark),
                            endIcon: <CheckIcon size="5" />,
                            _text: {
                                color: textColorPrimary(dark),
                            }
                        }}

                    >
                        <Select.Item label="System / Системна" value={DarkModeSetting.SYSTEM} />
                        <Select.Item label="Light / Світлий" value={DarkModeSetting.LIGHT} />
                        <Select.Item label="Dark / Темний" value={DarkModeSetting.DARK} />
                    </Select>
                </SettingsRow>

                <SettingsRow title="Phonetic / Фонетично">
                    <Switch
                        trackColor={{
                            false: switchColorTrack(dark, false),
                            true: switchColorTrack(dark, true),
                        }}
                        thumbColor={switchColorThumb(dark)}
                        value={isPhoneticChecked}
                        onValueChange={(value) => {
                            const newValue = value ? PhoneticModeSetting.STANDARD : PhoneticModeSetting.OFF;
                            store.dispatch({ type: updatePhoneticMode, payload: newValue });
                        }} />
                </SettingsRow>


                {/* TODO: Keep awake setting!! Right now it's just always on, no way to disable
            https://docs.expo.dev/versions/latest/sdk/keep-awake/ */}

                <SettingsRow title="Update songs / Оновлювати пісні">
                    <Button
                        style={{ backgroundColor: backgroundColorButton(dark) }}
                        _text={{ color: textColorPrimary(dark) }}
                        onPress={() => {
                            store.dispatch({ type: RELOAD_SONG_LIST, payload: true });
                        }}
                    >
                        Update
                    </Button>
                </SettingsRow>

                <SettingsRow title="Updated / Оновлені" subtitle={lastUpdatedHuman}>
                    <Text color={textColorPrimary(dark)} fontSize={16}>
                        {
                            updated + ' / ' + (total === 0 ? '?' : total)
                            + ' (' + (total === 0 ? 0 : (updated / total * 100).toFixed(0)) + '%)'
                        }
                    </Text>
                </SettingsRow>

                <SettingsRow title="Downloaded / Завантажені" subtitle={''}>
                    <Text color={textColorPrimary(dark)} fontSize={16}>
                        {
                            populated + ' / ' + (total === 0 ? '?' : total)
                            + ' (' + (total === 0 ? 0 : (populated / total * 100).toFixed(0)) + '%)'
                        }
                    </Text>
                </SettingsRow>

                <SettingsRow title="Clear data / Очистити дані">
                    <Button
                        style={{ backgroundColor: backgroundColorButtonWarning(dark), }}
                        _text={{ color: textColorPrimary(dark) }}
                        onPress={() => {
                            Alert.alert(
                                "Are your sure? Справді?",
                                "Are you sure you want to clear all the app data?\n\nСправді очистити всі дані?",
                                [
                                    {
                                        text: (isPhoneticChecked ? 'No' : "Ні"),
                                    },
                                    {
                                        text: (isPhoneticChecked ? "Yes" : "Так"),
                                        onPress: () => {
                                            store.dispatch({ type: resetApp });
                                            store.dispatch({ type: RELOAD_SONG_LIST, payload: true });
                                        },
                                    },
                                ]
                            );
                        }}>
                        Reset
                    </Button>
                </SettingsRow>

                {
                    error ? <SettingsRow title="Last Error">
                        <Text color={textColorError(dark)} fontSize={14}>
                            {error}
                        </Text>
                    </SettingsRow>
                        : null
                }
            </View>
        </ScrollView>
    );
}