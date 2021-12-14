import { StackCardStyleInterpolator } from "@react-navigation/stack";
import { Animated } from "react-native";

const animation: StackCardStyleInterpolator = ({
    current,
    next,
    inverted,
    layouts: { screen },
}) => {
    const { add, multiply } = Animated;
    const translateFocused = multiply(
        current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [screen.width, 0],
            extrapolate: 'clamp',
        }),
        inverted
    );

    const translateUnfocused = next
        ? multiply(
            next.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, screen.width * -1],
                extrapolate: 'clamp',
            }),
            inverted
        )
        : 0;

    return ({
        cardStyle: {
            transform: [
                // Translation for the animation of the current card
                { translateX: translateFocused },
                // Translation for the animation of the card on top of this
                { translateX: translateUnfocused },
            ],
        },
    })
};
export default animation;