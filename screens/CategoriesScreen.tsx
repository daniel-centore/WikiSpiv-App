import { Center, Text } from "native-base";
import React, { useEffect } from "react";
import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSelector } from "react-redux";
import CategoryItem from "../components/CategoryItem";
import { RootState, store } from "../store/store";
import { backgroundColorPrimary, backgroundColorTabBar, textColorHeaderDarkBg, useDark } from "../utils/color";
import Loading from "./Loading";

export default function CategoriesScreen() {
    const dark = useDark();
    const displayCategories = useSelector((state: RootState) => state.displayCategories);

    if (!displayCategories) {
        return <Loading includeLogo={true} />;
    }

    return (
        <View style={{
            backgroundColor: backgroundColorPrimary(dark),
            flex: 1,
        }}>
            <View style={{
                backgroundColor: backgroundColorTabBar(dark),
                width: '100%',
                paddingHorizontal: 10,
                paddingTop: dark ? 20 : 10,
                paddingBottom: 20,
            }}>
                <Center>
                    <Text style={{
                        fontSize: 20,
                        color: textColorHeaderDarkBg(dark),
                        fontWeight: 'bold'
                    }}>
                        {'Categories / Катеґорії'}
                    </Text>
                </Center>
            </View>
            <ScrollView>
                {
                    displayCategories.map((cat, idx) => <CategoryItem title={cat} index={idx} key={idx + '|' + cat} />)
                }
            </ScrollView>
        </View>
    )
}