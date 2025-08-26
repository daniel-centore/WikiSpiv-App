import React from 'react';
import { backgroundColorPrimary, useDark, textColorEmphasized } from '../utils/color';
import { View } from 'react-native';
import { Text } from 'react-native-paper';

export default function SongError () {
    const dark = useDark();
    return (
        <View
            style={{
                backgroundColor: backgroundColorPrimary(dark),
                height: '100%',
                width: '100%',
            }}
        >
            <View
                style={{
                    marginTop: '35%',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Text style={{ color: textColorEmphasized(dark), fontSize: 20 }}>
                    Something went wrong while loading the song
                </Text>
            </View>
        </View>
    );
}
