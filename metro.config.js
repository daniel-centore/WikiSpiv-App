const { getDefaultConfig } = require("expo/metro-config");

const {
    resolver: { extraNodeModules, ...resolver },
    ...config
} = getDefaultConfig(__dirname);

module.exports = {
    ...config,
    resolver: {
        ...resolver,
        extraNodeModules: {
            ...extraNodeModules,
            // Needed so we can trick wikijs, a NodeJS module, into using
            // readable-stream as a replacement for the NodeJS builtin stream
            stream: require.resolve('readable-stream'),
        },
    },
};