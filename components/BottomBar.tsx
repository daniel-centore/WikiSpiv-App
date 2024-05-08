import React from 'react';
import { Keyboard } from 'react-native';
import {
    Pressable,
    Center,
    HStack,
    Icon,
} from 'native-base';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { backgroundColorTabBar } from '../utils/color';

type MyProps = {
    bottomTabProps: BottomTabBarProps,
    dark: boolean,
};
type MyState = {
    keyboardShown: boolean,
};
export default class BottomBar extends React.Component<MyProps, MyState> {
    state: MyState = {
        keyboardShown: false,
    };

    keyboardDidHideListener: any;
    keyboardDidShowListener: any;

    componentDidMount() {
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
            this.setState({
                ...(this.state),
                keyboardShown: true,
            });
        });
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            this.setState({
                ...(this.state),
                keyboardShown: false,
            });
        });
    }

    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
    }

    render() {
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
            <HStack bg={backgroundColorTabBar(dark)} alignItems="center" safeAreaBottom shadow={6}>
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
            </HStack>
        );
    }

    getSettings(route: string) {
        switch (route) {
            case 'search':
                return {
                    title: "Пошук",
                    selectedIcon: (<MaterialIcons name={'search'} />),
                    outlineIcon: (<MaterialIcons name={'search'} />),
                };
            case 'categories':
                return {
                    title: "Категорії",
                    selectedIcon: (<MaterialCommunityIcons name={'widgets'} />),
                    outlineIcon: (<MaterialCommunityIcons name={'widgets-outline'} />),
                };
            case 'recent':
                return {
                    // Intentionally using diasporic spelling, DO NOT CHANGE TO ОСТАННІ
                    title: "Остатні",
                    selectedIcon: (<MaterialCommunityIcons name={'history'} />),
                    outlineIcon: (<MaterialCommunityIcons name={'history'} />),
                };
            case 'bookmarks':
                return {
                    title: "Закладки",
                    selectedIcon: (<MaterialCommunityIcons name={'heart'} />),
                    outlineIcon: (<MaterialCommunityIcons name={'heart-outline'} />),
                };
            case 'settings':
                return {
                    title: "Настройки",
                    selectedIcon: (<MaterialCommunityIcons name={'cog'} />),
                    outlineIcon: (<MaterialCommunityIcons name={'cog-outline'} />),
                };
        }
        return {
            title: "null",
            selectedIcon: (<MaterialCommunityIcons name={'null'} />),
            outlineIcon: (<MaterialCommunityIcons name={'null'} />),
        };
    }
}

function BottomBarButton(props: {
    isSelected: boolean,
    onPress: () => void,
    onLongPress: () => void
    selectedIcon: JSX.Element,
    outlineIcon: JSX.Element,
    title: string,
}) {
    return (
        <Pressable
            opacity={props.isSelected ? 1 : 0.5}
            py="3"
            flex={1}
            onPress={props.onPress}
            onLongPress={props.onLongPress}
        >
            <Center>
                <Icon
                    mb="1"
                    as={
                        props.isSelected ? props.selectedIcon : props.outlineIcon
                    }
                    color="white"
                    size="lg"
                />
                {/* <Text color="white" fontSize="12">
                    {props.title}
                </Text> */}
            </Center>
        </Pressable>
    );
}
