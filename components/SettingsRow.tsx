import { Text, View } from "native-base";
import React, { ReactNode } from "react";
import { textColorPrimary, textColorSecondary, useDark } from "../utils/color";

export default function SettingsRow(props: {
    title: string,
    children: ReactNode,
    subtitle?: string,
    minTitleWidth?: number,
}) {
    const dark = useDark();
    return (
        <View style={{
            paddingHorizontal: 16,
            paddingBottom: 20,
            flexDirection: 'row',
        }}>
            <View style={{
                flex: 1,
                justifyContent: 'center',
                paddingRight: 20,
                minWidth: props.minTitleWidth ?? 75,
            }}>
                <Text color={textColorPrimary(dark)} fontSize={16}>{props.title}</Text>
                {
                    !props.subtitle ? null
                        : <Text color={textColorSecondary(dark)} fontSize={12}>{props.subtitle}</Text>
                }
            </View>
            <View flexShrink={1}>
                {props.children}
            </View>
        </View>
    );
}