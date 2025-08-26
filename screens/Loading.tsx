import React from 'react';
import { backgroundColorPrimary, useDark, textColorEmphasized, textColorError, textColorPrimary } from '../utils/color';
import { useError } from '../utils/errorHandling';
import logo from '../assets/images/logo.png';
import { Image, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

export default function Loading (props: { includeLogo: boolean }) {
    const dark = useDark();
    const error = useError();
    return (
        <View
            style={{
                height: '100%',
                width: '100%',
                flex: 1,
                backgroundColor: backgroundColorPrimary(dark),
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <View
                style={{
                    marginTop: '-35%',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                {props.includeLogo ? (
                    <>
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
                    </>
                ) : null}

                <View>
                    <ActivityIndicator animating={true} color={textColorEmphasized(dark)} />
                    <Text
                        style={{
                            color: textColorEmphasized(dark),
                            fontSize: 20,
                        }}
                    >
                        Loading... прошу зачекайте!
                    </Text>
                </View>
                {error ? (
                    <Text
                        style={{
                            color: textColorError(dark),
                            fontSize: 16,
                            paddingTop: 40,
                            textAlign: 'center',
                        }}
                    >
                        {error}
                    </Text>
                ) : null}
            </View>
        </View>
    );
}
