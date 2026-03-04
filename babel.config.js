module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // reanimated 4.x no longer requires the babel plugin
  };
};
