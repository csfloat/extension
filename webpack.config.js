const path = require('path');
const glob = require('glob');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const CHROME_KEY = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmf6qYyrFypvvB0klM/hHhIdGO0bAnUT6ZK4fLqGl8/l5OWze2leeQkC/Nf0HOTQ50d2sdgXFuQDfHsMF+HQ5pUVIUT/25MzEXZWGwqi+JAxEX9Q/yGFFN53nI4m7mGNzCQ0TDUS3IrJsFfQBMEdv/fAwnhEitF/Ko9qn8/KYDzZqIjujwXKKeqlx+UXIvkgblI44RT9evwiqp+/WjZZ/YQzLa9tFhdz0Ct3Qvhn/03YrLAXa+yxXKpLAjQJ9DpYJoa++bJwluffinxKQUX0tm5dzFRSRKFCG92hKHnQHcQFUnBlDKF4LS0KQhgelyiTxN4GmKX7I1xQS/B1TByLL2wIDAQAB";

function getPathEntries(path) {
    return glob.sync(path).reduce((acc, e) => {
        if (!e.includes('node_modules')) {
            // Remove extension
            acc[e.replace(/\.[^/.]+$/, '')] = e;
        }

        return acc;
    }, {});
}

module.exports = (env) => {
    const mode = env.mode || 'development';

    return {
        mode: "none",
        entry: Object.assign(
            getPathEntries('./src/lib/page_scripts/*.ts'),
            getPathEntries('./src/lib/types/*.d.ts'),
            getPathEntries('./src/background.ts'),
            getPathEntries('./src/**/*.js')),
        output: {
            path: path.join(__dirname, "dist"),
            filename: "[name].js",
        },
        resolve: {
            extensions: [".ts", ".js", ".html"],
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: "ts-loader",
                    exclude: /node_modules|\.d\.ts$/,
                },
                {
                    test: /\.d\.ts$/,
                    loader: 'ignore-loader'
                },
                {
                    test: new RegExp(`.(css)$`),
                    loader: 'file-loader',
                    options: {
                        name : '[name].[ext]'
                    },
                    exclude: /node_modules/,
                },
            ],
        },
        plugins: [
            new MiniCssExtractPlugin(),
            new CopyPlugin({
                patterns: [
                    {from: "icons", to: "icons", context: "."},
                    {from: "src/model_frame.html", to: "src/", context: "."},
                    {from: "src/global.css", to: "src/", context: "."},
                    {
                        from: 'manifest.json',
                        to: 'manifest.json',
                        transform(raw) {
                            if (mode !== 'development') {
                                return raw;
                            }

                            // Ensure local dev version has same ID as PROD
                            const manifest = JSON.parse(raw.toString());
                            manifest.key = CHROME_KEY;

                            return JSON.stringify(manifest, null, 2);
                        },
                    },
                ]
            }),
        ],
        stats: {
            errorDetails: true,
        },
        optimization: {
            usedExports: true
        }
    }
};
