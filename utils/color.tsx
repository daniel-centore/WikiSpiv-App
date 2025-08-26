import React, { useEffect } from "react";
import { ColorValue, useColorScheme } from "react-native";
import { useSelector } from "react-redux";
import { DarkModeSetting } from "../store/SettingEnums";
import { RootState, store } from "../store/store";


export function useDark() {
    let colorScheme = useColorScheme();
    const mode = useSelector((state: RootState) => state.darkMode);

    switch (store.getState().darkMode) {
        case DarkModeSetting.LIGHT:
            return false;
        case DarkModeSetting.DARK:
            return true;
        case DarkModeSetting.SYSTEM:
        default:
            if (colorScheme === 'dark') {
                return true;
            }
            return false;
    }
}

export function textColorEmphasized(dark: boolean) {
    return dark ? 'rgb(255,255,255)' : 'rgb(0,0,0)';
}

export function textColorError(dark: boolean) {
    return dark ? 'rgb(235,235,52)' : 'rgb(235,52,70)';
}

export function textColorPrimary(dark: boolean) {
    return dark ? 'rgb(255,255,255)' : 'rgb(0,0,0)';
}

export function textColorSecondary(dark: boolean) {
    return dark ? 'rgb(175,175,175)' : 'rgb(80,80,80)';
}

export function textColorListHeaders(dark: boolean) {
    return dark ? 'rgb(255,255,255)' : 'rgb(0,0,0)';
}

export function textColorHeaderDarkBg(dark: boolean) {
    return 'rgb(255,255,255)';
}

export function backgroundColorPrimary(dark: boolean, pressed?: boolean) {
    if (pressed) {
        return dark ? 'rgb(80,80,80)' : 'rgb(175,175,175)';   
    }
    return dark ? 'rgb(10,10,10)' : 'rgb(245,245,245)';
}

export function backgroundColorSecondary(dark: boolean, pressed?: boolean) {
    if (pressed) {
        return dark ? 'rgb(100,100,100)' : 'rgb(130,130,130)';   
    }
    return dark ? 'rgb(30,30,30)' : 'rgb(200,200,200)';
}

export function backgroundColorSelected(dark: boolean) {
    return dark ? 'rgb(55,0,237)' : 'rgb(159,130,255)';
}

export function backgroundColorButton(dark: boolean) {
    return dark ? 'rgb(55,0,237)' : 'rgb(159,130,255)';
}

export function backgroundColorButtonWarning(dark: boolean) {
    return dark ? 'rgb(156,11,0)' : 'rgb(255,110,99)';
}

export function switchColorThumb(dark: boolean): ColorValue {
    return dark ? 'rgb(55,0,237)' : 'rgb(159,130,255)';
}

export function switchColorTrack(dark: boolean, selected: boolean): ColorValue {
    if (selected) {
        return dark ? 'rgb(134,107,250)' : 'rgb(178,161,255)';
    } else {
        return dark ? 'rgb(166,166,166)' : 'rgb(166,166,166)';
    }
}

export function backgroundColorMenu(dark: boolean) {
    return dark ? 'rgb(30,30,30)' : 'rgb(200,200,200)';
}

export function backgroundColorListHeaders(dark: boolean) {
    return dark ? '#2C0061' : '#A269FF';
}

export function backgroundColorAppBar(dark: boolean) {
    return dark ? 'rgb(20,20,20)' : 'rgb(255,255,255)';
}

export function backgroundColorStatusBar(dark: boolean) {
    return dark ? 'rgb(0,0,0)' : '#3700B3';
}

export function backgroundColorTabBar(dark: boolean) {
    return dark ? 'rgb(20,20,20)' : '#3700B3';
}

export function backgroundColorSearchBar(dark: boolean) {
    return dark
        ? backgroundColorTabBar(true)
        : backgroundColorMainView(false);
}

export function backgroundColorMainView(dark: boolean) {
    return dark ? 'rgb(30,30,30)' : 'rgb(255,255,255)';
}

export function highlightColor(dark: boolean) {
    return dark ? 'rgb(70,70,70)' : 'rgb(200,200,200)';
}

export function scrollbarLineColor(dark: boolean) {
    return dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
}

export function scrollbarHandleColor(dark: boolean) {
    return dark ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,1)';
}

export function scrollbarHeaderBackgroundColor(dark: boolean) {
    return dark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.5)';
}

export function scrollbarHeaderTextColor(dark: boolean) {
    return dark ? 'rgb(0,0,0)' : 'rgb(255,255,255)';
}