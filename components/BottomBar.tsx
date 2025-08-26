import React, { ComponentProps } from 'react';
import { Keyboard, Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { backgroundColorTabBar } from '../utils/color';
import { Text } from 'react-native-paper';

type MyProps = {
    bottomTabProps: BottomTabBarProps;
    dark: boolean;
};
type MyState = {
    keyboardShown: boolean;
};
export default class BottomBar extends React.Component<MyProps, MyState> {
    state: MyState = {
        keyboardShown: false,
    };

    keyboardDidHideListener: any;
    keyboardDidShowListener: any;

    componentDidMount () {
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
            this.setState({
                ...this.state,
                keyboardShown: true,
            });
        });
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            this.setState({
                ...this.state,
                keyboardShown: false,
            });
        });
    }

    componentWillUnmount () {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
    }

    render () {
        if (this.state.keyboardShown) {
            // Hide bottom bar when keyboard is visible
            return null;
        }
        const props = this.props;
        const btp = props.bottomTabProps;
        const state = btp.state;
        const descriptors = btp.descriptors;
        const navigation = btp.navigation;
        const dark = props.dark;
        return (
            <View
                style={{
                    backgroundColor: backgroundColorTabBar(dark),
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
                // safeAreaBottom
                // shadow={6}
            >
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isSelected = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isSelected && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    return (
                        <BottomBarButton
                            isSelected={isSelected}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            key={route.name}
                            {...this.getSettings(route.name)}
                        />
                    );
                })}
            </View>
        );
    }

    getSettings (route: string): {
        title: string;
        selectedIcon: ComponentProps<typeof MaterialCommunityIcons>['name'];
        outlineIcon: ComponentProps<typeof MaterialCommunityIcons>['name'];
    } {
        switch (route) {
            case 'search':
                return {
                    title: 'Пошук',
                    selectedIcon: 'magnify',
                    outlineIcon: 'magnify',
                };
            case 'categories':
                return {
                    // Intentionally using diasporic spelling, DO NOT CHANGE TO КАТЕГОРІї
                    title: 'Катеґорії',
                    selectedIcon: 'widgets',
                    outlineIcon: 'widgets-outline',
                };
            case 'recent':
                return {
                    // Intentionally using diasporic spelling, DO NOT CHANGE TO ОСТАННІ
                    title: 'Остатні',
                    selectedIcon: 'history',
                    outlineIcon: 'history',
                };
            case 'bookmarks':
                return {
                    title: 'Закладки',
                    selectedIcon: 'heart',
                    outlineIcon: 'heart-outline',
                };
            case 'settings':
                return {
                    title: 'Настройки',
                    selectedIcon: 'cog',
                    outlineIcon: 'cog-outline',
                };
        }
        return {
            title: 'null',
            selectedIcon: 'null',
            outlineIcon: 'null',
        };
    }
}

function BottomBarButton (props: {
    isSelected: boolean;
    onPress: () => void;
    onLongPress: () => void;
    selectedIcon: ComponentProps<typeof MaterialCommunityIcons>['name'];
    outlineIcon: ComponentProps<typeof MaterialCommunityIcons>['name'];
    title: string;
}) {
    return (
        <Pressable
            style={{
                opacity: props.isSelected ? 1 : 0.5,
                paddingTop: 3,
                paddingBottom: 3,
                flex: 1,
                alignItems: 'center',
            }}
            onPress={props.onPress}
            onLongPress={props.onLongPress}
        >
            <MaterialCommunityIcons
                size={35}
                color={'white'}
                name={props.isSelected ? props.selectedIcon : props.outlineIcon}
            />
            <Text style={{ color: 'white', fontSize: 12 }}>{props.title}</Text>
        </Pressable>
    );
}
