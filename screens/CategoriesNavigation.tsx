import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { useSelector } from "react-redux";
import StackNavAnimationStyle from "../components/StackNavAnimationStyle";
import { RootState } from "../store/store";
import { backgroundColorAppBar, textColorPrimary, useDark } from "../utils/color";
import { getPhonetic } from "../utils/phonetic";
import CategoriesScreen from "./CategoriesScreen";
import CategorySongsScreen from "./CategorySongsScreen";

export type CategoriesStackParamList = {
    categoryList: {},
    categorySongs: {
        category: string;
    },
};
const Stack = createStackNavigator<CategoriesStackParamList>();

export default function CategoriesNavigation() {
    const dark = useDark();
    const phonetic = useSelector((state: RootState) => state.phoneticMode);
    return (
        <Stack.Navigator screenOptions={{
            // Safe area already handled below, without this we double it
            headerStatusBarHeight: 0,
            headerTintColor: textColorPrimary(dark),
            headerTitleStyle: {
                color: textColorPrimary(dark)
            },
            headerStyle: {
                backgroundColor: backgroundColorAppBar(dark),
            },
            cardStyleInterpolator: StackNavAnimationStyle,
            headerBackTitleVisible: false,
        }}
        >
            <Stack.Screen
                name="categoryList"
                component={CategoriesScreen}
                options={{
                    // Title needed for back button on iOS
                    title: "Катеґорії",
                    headerShown: false,
                }}
            />
            <Stack.Screen
                    name="categorySongs"
                    component={CategorySongsScreen}
                    options={({ route }) => ({
                        title: getPhonetic(phonetic, route.params.category, true),
                    })}
                />
        </Stack.Navigator>
    );
}