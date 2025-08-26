import React from 'react';
import { Alert, Image, ScrollView, View, StyleSheet } from 'react-native';
import SettingsRow from '../components/SettingsRow';
import { RELOAD_SONG_LIST, resetApp, RootState, store, updateDarkMode, updatePhoneticMode } from '../store/store';
import {
    backgroundColorButton,
    backgroundColorButtonWarning,
    backgroundColorPrimary,
    switchColorThumb,
    switchColorTrack,
    textColorError,
    textColorPrimary,
    textColorSecondary,
    useDark,
} from '../utils/color';
import logo from '../assets/images/logo.png';
import { DarkModeSetting, PhoneticModeSetting } from '../store/SettingEnums';
import { useError } from '../utils/errorHandling';
import Constants from 'expo-constants';
import { useSelector } from 'react-redux';
import { Button, Text, Switch } from 'react-native-paper';
import Select from 'rn-custom-select-dropdown';

export default function Settings () {
    const dark = useDark();
    const error = useError();
    const songs = useSelector((state: RootState) => state.songs);
    const darkModeSetting = useSelector((state: RootState) => state.darkMode);
    const phoneticModeSetting = useSelector((state: RootState) => state.phoneticMode);
    const lastUpdateTrigger = useSelector((state: RootState) => state.lastUpdateTrigger);

    const isPhoneticChecked = phoneticModeSetting !== PhoneticModeSetting.OFF;

    const updated = songs.filter(s => s.populated && s.populated.populatedTime > lastUpdateTrigger).length;
    const populated = songs.filter(s => s.populated?.populatedTime).length;
    const total = songs.length;
    const lastUpdatedDate = new Date(lastUpdateTrigger);
    const lastUpdatedHuman = lastUpdatedDate.toLocaleDateString() + ' ' + lastUpdatedDate.toLocaleTimeString();
    const themeValues = [
        { label: 'System / Системна', value: DarkModeSetting.SYSTEM },
        { label: 'Light / Світлий', value: DarkModeSetting.LIGHT },
        { label: 'Dark / Темний', value: DarkModeSetting.DARK },
    ];

    return (
        <ScrollView
            style={{
                backgroundColor: backgroundColorPrimary(dark),
                height: '100%',
                width: '100%',
                paddingTop: 20,
                paddingBottom: 20,
                paddingHorizontal: 10,
            }}
        >
            <View style={{ paddingBottom: 20 }}>
                <View
                    style={{
                        alignItems: 'center',
                        width: '100%',
                        paddingBottom: 15,
                    }}
                >
                    <Image source={logo} style={{ width: 100, height: 100 }} />
                </View>
                <Text
                    style={{
                        paddingBottom: 5,
                        textAlign: 'center',
                        color: textColorPrimary(dark),
                        fontSize: 40,
                        lineHeight: 45,
                    }}
                >
                    {'WikiSpiv'}
                </Text>
                <Text
                    style={{
                        paddingBottom: 20,
                        textAlign: 'center',
                        color: textColorPrimary(dark),
                        fontSize: 14,
                    }}
                >
                    {'Спільний Співаник Української Діяспори' +
                        '\nThe Collaborative Ukrainian Diaspora Spivanyk' +
                        '\n(C) Danylo Centore 2016 - ' +
                        new Date().getFullYear() +
                        '\nv' +
                        Constants.expoConfig?.version}
                </Text>
                <SettingsRow title='Theme / Тема'>
                    <Select
                        containerStyle={{
                            minWidth: 195,
                            backgroundColor: backgroundColorPrimary(dark),
                        }}
                        inputContainerStyle={{
                            backgroundColor: backgroundColorPrimary(dark),
                            borderColor: textColorSecondary(dark),
                        }}
                        placeholderStyle={{
                            color: textColorPrimary(dark),
                        }}
                        arrowColor={textColorPrimary(dark)}
                        itemBackgroundColor={backgroundColorPrimary(dark)}
                        selectedItemBackgroundColor={backgroundColorPrimary(dark)}
                        itemLabelColor={textColorPrimary(dark)}
                        selectedItemLabelColor={textColorPrimary(dark)}
                        checkColor={textColorPrimary(dark)}
                        

                        shouldCloseAfterSelection

                        data={themeValues}
                        value={themeValues.find(x => x.value === darkModeSetting) ?? themeValues[0]}
                        onChange={value => {
                            store.dispatch({ type: updateDarkMode.toString(), payload: value.value });
                        }}
                    />
                </SettingsRow>

                <SettingsRow title='Phonetic / Фонетично'>
                    <Switch
                        style={{ transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }] }}
                        trackColor={{
                            false: switchColorTrack(dark, false),
                            true: switchColorTrack(dark, true),
                        }}
                        thumbColor={switchColorThumb(dark)}
                        value={isPhoneticChecked}
                        onValueChange={value => {
                            const newValue = value ? PhoneticModeSetting.STANDARD : PhoneticModeSetting.OFF;
                            store.dispatch({ type: updatePhoneticMode.toString(), payload: newValue });
                        }}
                    />
                </SettingsRow>

                <SettingsRow title='Update songs / Оновлювати пісні'>
                    <Button
                        style={{ backgroundColor: backgroundColorButton(dark) }}
                        textColor={textColorPrimary(dark)}
                        onPress={() => {
                            store.dispatch({ type: RELOAD_SONG_LIST, payload: true });
                        }}
                    >
                        Update
                    </Button>
                </SettingsRow>

                <SettingsRow title='Updated / Оновлені' subtitle={lastUpdatedHuman}>
                    <Text style={{ color: textColorPrimary(dark), fontSize: 16 }}>
                        {updated +
                            ' / ' +
                            (total === 0 ? '?' : total) +
                            ' (' +
                            (total === 0 ? 0 : ((updated / total) * 100).toFixed(0)) +
                            '%)'}
                    </Text>
                </SettingsRow>

                <SettingsRow title='Downloaded / Завантажені' subtitle={''}>
                    <Text style={{ color: textColorPrimary(dark), fontSize: 16 }}>
                        {populated +
                            ' / ' +
                            (total === 0 ? '?' : total) +
                            ' (' +
                            (total === 0 ? 0 : ((populated / total) * 100).toFixed(0)) +
                            '%)'}
                    </Text>
                </SettingsRow>

                <SettingsRow title='Clear data / Очистити дані'>
                    <Button
                        style={{ backgroundColor: backgroundColorButtonWarning(dark) }}
                        textColor={textColorPrimary(dark)}
                        onPress={() => {
                            Alert.alert(
                                'Are your sure? Справді?',
                                'Are you sure you want to clear all the app data?\n\nСправді очистити всі дані?',
                                [
                                    {
                                        text: isPhoneticChecked ? 'No' : 'Ні',
                                    },
                                    {
                                        text: isPhoneticChecked ? 'Yes' : 'Так',
                                        onPress: () => {
                                            store.dispatch({ type: resetApp.toString() });
                                            store.dispatch({ type: RELOAD_SONG_LIST, payload: true });
                                        },
                                    },
                                ],
                            );
                        }}
                    >
                        Reset
                    </Button>
                </SettingsRow>

                {error ? (
                    <SettingsRow title='Last Error'>
                        <Text style={{ color: textColorError(dark), fontSize: 14 }}>{error}</Text>
                    </SettingsRow>
                ) : null}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    dropdownButtonStyle: {
        width: 200,
        height: 50,
        backgroundColor: '#E9ECEF',
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    dropdownButtonTxtStyle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '500',
        color: '#151E26',
    },
    dropdownButtonArrowStyle: {
        fontSize: 28,
    },
    dropdownButtonIconStyle: {
        fontSize: 28,
        marginRight: 8,
    },
    dropdownMenuStyle: {
        backgroundColor: '#E9ECEF',
        borderRadius: 8,
    },
    dropdownItemStyle: {
        width: '100%',
        flexDirection: 'row',
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
    },
    dropdownItemTxtStyle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '500',
        color: '#151E26',
    },
    dropdownItemIconStyle: {
        fontSize: 28,
        marginRight: 8,
    },
});
