/**
 * @packageDocumentation
 *  {@inheritDoc getWebpackConfig}
 */
import CopyPlugin from 'copy-webpack-plugin'
import HtmlWebPackPlugin from 'html-webpack-plugin'
import postCssPresetEnv from 'postcss-preset-env'
import webpack from 'webpack'
import babelConfig from '../babel.config'
import sharedConfig from '../shared/config'

/**
 * Provides the webpack configuration object.
 */
export const getWebpackConfig = () => {
  const config: webpack.Configuration = {
    mode: 'development',
    devtool: 'eval-source-map',
    devServer: {
      static: {
        publicPath: sharedConfig.webClientBundlePath,
      },
      client: {
        progress: true,
      },
      server: 'https',
      hot: process.env.CI ? false : true,
      open: process.env.PLAYWRIGHT_TEST == '1' ? false : true,
      port: 3000,
      historyApiFallback: true,
      headers: {
        //  Temporary fix.
        // The middlewares.unshift method in setupMiddlewares field
        //    is causing problem when the sw static file is fetched.
        'Service-Worker-Allowed': '/',
      },
      setupMiddlewares: (middlewares, devServer) => {
        if (!devServer) {
          throw new Error('webpack-dev-server is not defined')
        }
        return middlewares
      },
    },

    entry: {
      mainApp: './web-client/index.tsx',
    },
    output: {
      filename: (pathData) => {
        if (
          pathData.chunk?.name === 'serviceWorker' ||
          pathData.chunk?.name === 'sharedWorker'
        )
          return `static/[name].js`
        return `static/[name].[contenthash].js`
      },
      chunkFilename: 'static/[name].[contenthash].js',
      cssChunkFilename: 'static/[name].[contenthash].css',
      cssFilename: 'static/[name].[contenthash].css',
      path: sharedConfig.webClientBundlePath,
    },
    module: {
      rules: [
        /**
         * Loading Typescript and JavaScript files
         */
        {
          test: /\.(ts|js)x?$/,
          exclude: [/node_modules/],
          use: [
            {
              loader: 'babel-loader',
              options: {
                plugins: [['babel-plugin-react-compiler'], {}],
                presets: babelConfig.presets,
              },
            },
          ],
        },
        /**
         * Loading CSS files
         */
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [postCssPresetEnv],
                },
              },
            },
          ],
        },
      ],
    },
    optimization: {
      moduleIds: 'deterministic',
      // minimize: true,
      usedExports: 'global',
      splitChunks: {
        cacheGroups: {
          /**
           * Caching dependencies into separate chunk to
           * reduce rebuild times.
           * It also increases the FCP metric.
           */
          vendor: {
            test: /[\\/]node_modules[\\/](?!react-dom)/,
            name: 'vendors',
            chunks(chunk) {
              return (
                chunk.name !== 'serviceWorker' &&
                chunk.name !== 'sharedWorker' &&
                chunk.canBeInitial()
              )
            },
          },
          /**
           * Caching dependencies into separate chunk to
           * reduce rebuild times.
           * It also increases the FCP metric.
           */
          reactDom: {
            test: /[\\/]node_modules[\\/]react-dom[\\/]/,
            name: 'reactDom',
            chunks: 'initial',
          },
          /**
           * Caching lazy loaded modules into a separate chunk.
           * It includes the vendors which are imported only by lazy loaded modules.
           */
          asyncModule: {
            name: 'asyncModules',
            chunks: 'async',
          },
        },
      },
    },

    plugins: [
      new CopyPlugin({
        patterns: [{ from: 'public', to: 'static/assets' }],
      }),
      new HtmlWebPackPlugin({
        template: './public/index.html',
      }),

      /**
       * Providing process.env as a global variable,
       * for the compilation step
       */
      new webpack.DefinePlugin({
        process: {
          env: JSON.stringify(process.env),
        },
        'globalThis.__DEV__': true,
      }),
    ],
    resolve: {
      fallback: {
        url: false,
        path: false,
      },
      extensions: ['.tsx', '.ts', '.json', '.jsx', '.js'],
    },
  }

  return config
}

//  For knip
export default getWebpackConfig()
