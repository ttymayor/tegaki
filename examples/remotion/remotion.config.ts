import { Config } from '@remotion/cli/config';

// Inline TTF fonts (including tegaki's bundled fonts) as data URLs so they
// resolve correctly in both Remotion Studio and the renderer.
// Without this, webpack emits asset URLs with relative paths like
// `../../packages/renderer/dist/fonts/caveat/caveat.ttf` which escape the
// studio's served root and fall through to the SPA catch-all.
Config.overrideWebpackConfig((config) => {
  return {
    ...config,
    resolve: {
      ...config.resolve,
      // harfbuzzjs ships an Emscripten-generated module that statically
      // requires Node built-ins (fs/path/crypto) inside a runtime branch
      // that's only taken under Node. Stub them out for the browser bundle.
      fallback: {
        ...config.resolve?.fallback,
        fs: false,
        path: false,
        crypto: false,
      },
    },
    module: {
      ...config.module,
      rules: [
        ...(config.module?.rules ?? []).filter((rule) => {
          if (typeof rule !== 'object' || !rule || !rule.test) return true;
          const test = rule.test;
          return !(test instanceof RegExp && test.test('a.ttf'));
        }),
        {
          test: /\.ttf$/,
          type: 'asset/inline',
        },
      ],
    },
  };
});
