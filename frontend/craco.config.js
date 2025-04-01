const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    style: {
        postcss: {
            mode: 'file',
        },
    },
    webpack: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
        configure: (webpackConfig) => {
            // Entferne das bestehende HtmlWebpackPlugin
            webpackConfig.plugins = webpackConfig.plugins.filter(
                (plugin) => !(plugin instanceof HtmlWebpackPlugin)
            );

            // Füge ein neues HtmlWebpackPlugin hinzu
            webpackConfig.plugins.push(
                new HtmlWebpackPlugin({
                    template: path.resolve(__dirname, 'public/index.html'),
                    inject: true
                })
            );

            return webpackConfig;
        }
    },
};