import { Heading, HStack, View } from "native-base";
import React from "react";
import { backgroundColorPrimary, useDark, textColorEmphasized } from "../utils/color";

export default function SongError() {
    const dark = useDark();
    return (
        <View style={{
            backgroundColor: backgroundColorPrimary(dark),
            height: '100%',
            width: '100%',
        }}>
            <View style={{
                marginTop: '35%',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <HStack space={2} alignItems="center">
                    <Heading color={textColorEmphasized(dark)} fontSize="md">
                        Something went wrong while loading the song
                    </Heading>
                </HStack>
            </View>
        </View>
    );
}