import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { View, Text, Center, Icon } from "native-base";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { backgroundColorPrimary, backgroundColorSecondary, useDark, textColorPrimary } from "../utils/color";
import { getPhonetic } from "../utils/phonetic";
import PressableDebounce from "./PressableDebounce";

export default function CategoryItem(props: {
    index: number,
    title: string,
}) {
    const dark = useDark();
    const navigation = useNavigation<StackNavigationProp<any>>();
    const phonetic = useSelector((state: RootState) => state.phoneticMode);

    const categoryTitle = props.title
        .substring('Category:'.length)
        .trim()
        .replace(/_/g, ' ');

    return (
        <PressableDebounce
            onPress={() => {
                navigation.push('categorySongs', {
                    category: categoryTitle,
                });
            }}
        >
            {({ pressed }) => (
                <View
                    style={{
                        height: 60,
                        paddingLeft: 10,
                    }}
                    backgroundColor={
                        (props.index % 2 === 0
                            ? backgroundColorPrimary(dark, pressed)
                            : backgroundColorSecondary(dark, pressed))
                    }
                >
                    <Text
                        color={textColorPrimary(dark)}
                        fontSize={18}
                        fontWeight={'bold'}
                        numberOfLines={2}
                    >
                        {getPhonetic(phonetic, categoryTitle, true)}
                    </Text>
                </View>
            )}

        </PressableDebounce>
    );
}
