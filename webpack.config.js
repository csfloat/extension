const path = require('path');
const glob = require('glob');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

const CHROME_KEY =
    'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmf6qYyrFypvvB0klM/hHhIdGO0bAnUT6ZK4fLqGl8/l5OWze2leeQkC/Nf0HOTQ50d2sdgXFuQDfHsMF+HQ5pUVIUT/25MzEXZWGwqi+JAxEX9Q/yGFFN53nI4m7mGNzCQ0TDUS3IrJsFfQBMEdv/fAwnhEitF/Ko9qn8/KYDzZqIjujwXKKeqlx+UXIvkgblI44RT9evwiqp+/WjZZ/YQzLa9tFhdz0Ct3Qvhn/03YrLAXa+yxXKpLAjQJ9DpYJoa++bJwluffinxKQUX0tm5dzFRSRKFCG92hKHnQHcQFUnBlDKF4LS0KQhgelyiTxN4GmKX7I1xQS/B1TByLL2wIDAQAB';

function getPathEntries(path) {
    return glob.sync(path).reduce((acc, e) => {
        if (!e.includes('node_modules')) {
            // Remove extension
            acc[e.replace(/\.[^/.]+$/, '')] = e;
        }

        return acc;
    }, {});
}

function convertToFirefoxManifest(manifest) {
    const cp = Object.assign({}, manifest);
    cp.background = {
        page: 'src/background_ff.html',
    };
    cp.browser_specific_settings = {
        gecko: {
            id: 'ff_extension@csfloat.com',
            strict_min_version: '109.0',
        },
    };
    return cp;
}

module.exports = (env) => {
    const mode = env.mode || 'development';

    return {
        mode: 'none',
        entry: Object.assign(
            getPathEntries('./src/lib/page_scripts/*.ts'),
            getPathEntries('./src/lib/types/*.d.ts'),
            getPathEntries('./src/background.ts'),
            getPathEntries('./src/**/*.js')
        ),
        output: {
            path: path.join(__dirname, 'dist'),
            filename: '[name].js',
        },
        resolve: {
            extensions: ['.ts', '.js', '.html'],
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: 'ts-loader',
                    exclude: /node_modules|\.d\.ts$/,
                },
                {
                    test: /\.d\.ts$/,
                    loader: 'ignore-loader',
                },
                {
                    test: new RegExp(`.(css)$`),
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]',
                    },
                    exclude: /node_modules/,
                },
            ],
        },
        plugins: [
            new MiniCssExtractPlugin(),
            new webpack.SourceMapDevToolPlugin({}),
            new CopyPlugin({
                patterns: [
                    {from: 'icons', to: 'icons', context: '.'},
                    {from: 'src/model_frame.html', to: 'src/', context: '.'},
                    {from: 'src/global.css', to: 'src/', context: '.'},
                    {from: 'src/background_ff.html', to: 'src/', context: '.'},
                    {from: 'src', to: 'raw/', context: '.'},
                    {from: 'README.md', to: '', context: '.'},
                    {
                        from: 'manifest.json',
                        to: 'manifest.json',
                        transform(raw) {
                            let processed = JSON.parse(raw.toString());

                            if (mode === 'development' && env.browser === 'chrome') {
                                processed.key = CHROME_KEY;
                            }

                            if (env.browser === 'firefox') {
                                processed = convertToFirefoxManifest(processed);
                            }

                            return JSON.stringify(processed, null, 2);
                        },
                    },
                ],
            }),
        ],
        stats: {
            errorDetails: true,
        },
        optimization: {
            usedExports: true,
        },
    };
};
