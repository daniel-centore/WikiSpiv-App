import React from 'react';
import { useDark, textColorEmphasized } from '../utils/color';
import { View } from 'react-native';
import { Text } from 'react-native-paper';

export default function NoResults () {
    const dark = useDark();
    return (
        <View
            style={{
                marginTop: '35%',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <View>
                <Text
                    style={{
                        color: textColorEmphasized(dark),
                        fontSize: 20,
                    }}
                >
                    {/* Intentionally using diasporic "Нема" - do not "correct" to "Немає" */}
                    No Results - Нема результатів
                </Text>
            </View>
        </View>
    );
}
