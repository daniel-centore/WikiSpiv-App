import { Heading, HStack, View } from "native-base";
import React from "react";
import { useDark, textColorEmphasized } from "../utils/color";

export default function NoResults() {
    const dark = useDark();
    return (
        <View style={{
            marginTop: '35%',
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            <HStack space={2} alignItems="center">
                <Heading color={textColorEmphasized(dark)} fontSize="md">
                    {/* Intentionally using diasporic "Нема" - do not "correct" to "Немає" */}
                    No Results - Нема результатів
                </Heading>
            </HStack>
        </View>
    );
}