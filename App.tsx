import 'react-native-gesture-handler';
import * as React from 'react';
import { DarkTheme, NavigationContainer, useNavigation } from '@react-navigation/native';
import {
    NativeBaseProvider,
    Box,
    Text,
    StatusBar,
    View,
    KeyboardAvoidingView,
} from 'native-base';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { persistor, RootState, store } from './store/store';
import Song from './interfaces/Song';
import BottomBar from './components/BottomBar'
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import SongModal from './screens/SongModal';
import Loading from './screens/Loading';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SearchScreen from './screens/SearchScreen';
import {
    backgroundColorAppBar,
    backgroundColorPrimary,
    backgroundColorStatusBar,
    useDark,
    textColorPrimary,
} from './utils/color';
import Settings from './screens/Settings';
import StackNavAnimationStyle from './components/StackNavAnimationStyle';
import CategoriesNavigation from './screens/CategoriesNavigation';
import SongHeaderMenu from './components/SongHeaderMenu';
import { getPhonetic } from './utils/phonetic';
import { Platform } from 'react-native';

export type StackParamList = {
    tabs: {},
    song: {
        song: Song;
    },
};

const Stack = createStackNavigator<StackParamList>();
const Tab = createBottomTabNavigator();

function RootContentSwitcher() {
    const dark = useDark();
    const phonetic = useSelector((state: RootState) => state.phoneticMode);
    return (
        <NavigationContainer theme={dark ? DarkTheme : undefined}>
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
                    name="tabs"
                    component={TabSwitcher}
                    options={{
                        // Title needed for back button on iOS
                        title: "Вдома",
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="song"
                    component={SongModal}
                    options={
                        ({ route }) => ({
                            title: getPhonetic(phonetic, route.params.song.init.name),
                            headerRight: () => <SongHeaderMenu song={route.params.song} />,
                        })
                    }
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

function TabSwitcher() {
    const dark = useDark();
    return (
        <Tab.Navigator
            tabBar={(props) => <BottomBar bottomTabProps={props} dark={dark} />}
            screenOptions={{ headerShown: false, }}
        >
            <Tab.Screen name="search" component={SearchScreen} />
            <Tab.Screen name="categories" component={CategoriesNavigation} />
            {/* <Tab.Screen name="recent" component={PlaceholderScreen} /> */}
            {/* <Tab.Screen name="bookmarks" component={PlaceholderScreen} /> */}
            <Tab.Screen name="settings" component={Settings} />
        </Tab.Navigator>
    );
}

function PlaceholderScreen() {
    const navigation = useNavigation<StackNavigationProp<any>>();

    return <View style={{ flex: 1 }}>
        <Text>{'Placeholder'}</Text>
    </View>;
}

function Content() {
    const dark = useDark();
    const bg = backgroundColorStatusBar(dark);
    return (
        <View style={{
            flex: 1,
            backgroundColor: backgroundColorPrimary(useDark()),
        }}>
            <MaybeWrapKeyboardAvoiding>
                <StatusBar backgroundColor={bg} barStyle="light-content" />
                <Box
                    safeAreaTop={true}
                    backgroundColor={bg}
                />
                <RootContentSwitcher />
            </MaybeWrapKeyboardAvoiding>
        </View>
    );
}

function MaybeWrapKeyboardAvoiding(props: { children: React.ReactNode }): JSX.Element {
    if (Platform.OS === "android") {
        // Android seems to avoid the keyboard without any additional help, and when
        // we wrap it in the KeyboardAvoidingView it messes up the view, so just
        // bypass it
        return <>{props.children}</>;
    }
    return <KeyboardAvoidingView
        behavior={'padding'}
        style={{ flex: 1, }}
    >
        {props.children}
    </KeyboardAvoidingView>
}

function LoadingBeforeStore() {
    const dark = useDark();
    const bg = backgroundColorStatusBar(dark);
    return <View style={{
        flex: 1,
        backgroundColor: backgroundColorPrimary(useDark()),
    }}>
        <MaybeWrapKeyboardAvoiding>
            <StatusBar backgroundColor={bg} barStyle="light-content" />
            <Box
                safeAreaTop={true}
                backgroundColor={bg}
            />
            <Loading includeLogo={true} />
        </MaybeWrapKeyboardAvoiding>
    </View>
}

export default function App() {
    return (
        <NativeBaseProvider config={{
            // Caused by search bar background against app background
            suppressColorAccessibilityWarning: true,
        }}>
            <Provider store={store}>
                <PersistGate
                    loading={<LoadingBeforeStore />}
                    persistor={persistor}
                >
                    <Content />
                </PersistGate>
            </Provider>
        </NativeBaseProvider>
    );
}
