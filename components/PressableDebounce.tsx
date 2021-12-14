import React, { useRef } from "react";
import { Pressable, PressableProps } from "react-native";

interface IProps extends PressableProps {
    debounceTime?: number,
}

export const NAVIGATION_DEBOUNCE_TIME = 600;
export const DEFAULT_DEBOUNCE_TIME = 300;
export const BUTTON_DEBOUNCE_TIME = 30;

export default function PressableDebounce(props: IProps) {
    const lastPress = useRef(0);
    return <Pressable {...props} onPress={(event) => {
        if (lastPress.current < Date.now() - (props.debounceTime ?? DEFAULT_DEBOUNCE_TIME)) {
            lastPress.current = Date.now();
            if (props.onPress) {
                props.onPress(event);
            }
        }
    }}>
        {props.children}
    </Pressable>
}