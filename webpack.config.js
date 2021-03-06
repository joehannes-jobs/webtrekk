var path = require("path");

var webpack = require("webpack");
var CopyWebpackPlugin = require("copy-webpack-plugin");
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var HtmlWebpackPlugin = require("html-webpack-plugin");
var ngAnnotatePlugin = require("ng-annotate-webpack-plugin");

var ENV = process.env.npm_lifecycle_event;
var isTest = ENV === "test" || ENV === "test-watch";
var isProd = ENV === "build";
var isDev = ENV === "serve";

const extractSass = new ExtractTextPlugin({
    filename: "styles/[name].[contenthash].css",
	publicPath: "/assets/styles/"
});

let jsloaders = [{
	loader: "babel-loader",
	options: {
		presets: [
			"env", "stage-0", "flow", "es2017" //dupe hack to make my plugin work
		],
		plugins: [
			"transform-runtime",
			"transform-decorators-legacy"
		]
	}
}];
if (!isTest) {
	jsloaders.push({
		loader: "eslint-loader",
		options: {
			formatter: require("eslint/lib/formatters/stylish"),
			failOnWarning: false,
			failOnError: true
		}
	});
}

let config = {
    entry: isTest ? void 0 : ["./build/app/app.js"],
    output: {
        filename: isProd
            ? "[name].[hash].js"
            : "[name].bundle.js",
        path: isProd ? path.resolve(__dirname, "dist") : path.resolve(__dirname, "build"),
		publicPath: '/',
		chunkFilename: isProd
            ? "[name].[hash].js"
            : "[name].bundle.js"
    },
    devtool: isProd
        ? "source-map"
        : (isTest
            ? "inline-source-map"
            : "eval-source-map"),
    devServer: {
        contentBase: "build",
        stats: "minimal"
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules\/(?!ng-harmony.*\/).*/,
                use: jsloaders
            }, {
                test: /\.html$/,
                use: [
                    {
                        loader: "html-loader",
                        options: {
                            minimize: true
                        }
                    }
                ]
            }, {
				include: /\.pug/,
				loader: ['html-loader', 'pug-html-loader'],
			}, {
                test: /\.sass$/,
                use: isProd ?
					extractSass.extract({
						use: [{
							loader: "css-loader"
						}, {
							loader: "sass-loader",
							options: {
								includePaths: ["/assets/styles", "/styles", "/node_modules"]
							}
						}]
					}) : [
                    {
                        loader: "style-loader" // creates style nodes from JS strings
                    }, {
                        loader: "css-loader" // translates CSS into CommonJS
                    }, {
                        loader: "sass-loader", // compiles Sass to CSS
                        options: {
                            includePaths: ["/assets/styles", "/styles", "/node_modules"],
							sourceMap: true
                        }
                    }
                ]
            }, {
                test: /\.(jpe?g|png|gif|svg)$/i,
                loaders: [
                    "file-loader?hash=sha512&digest=hex&name=[hash].[ext]", {
                        "loader": "image-webpack-loader",
                        "query": {
                            "mozjpeg": {
                                "progressive": true
                            },
                            "gifsicle": {
                                "interlaced": false
                            },
                            "optipng": {
                                "optimizationLevel": 4
                            },
                            "pngquant": {
                                "quality": "75-90",
                                "speed": 3
                            }
                        }
                    }
                ]
            }, {
                test: /\.(eot|svg|ttf|woff|woff2)$/,
                loader: "file-loader?name=fonts/[name].[ext]"
            }
        ]
    },
    resolve: {
        mainFields: ["browser", "module", "main"]
    },
    externals: {
        fs: "{}"
    },
    cache: false
};

if (isTest) {
    config.module.rules.push({
        enforce: "pre",
        test: /\.spec\.js$/,
        exclude: [
            /node_modules/, /\.spec\.js$/
        ],
        loader: "istanbul-instrumenter-loader",
        query: {
            esModules: true
        }
    });
}
if (isDev) {
	config.plugins = [new HtmlWebpackPlugin({
		title: 'Webtrekk Demo Joehannes',
		inject: false,
		template: '!!pug-loader!index.pug',
		"files": {
			"css": [ "main.css" ],
			"js": ["main_bundle.js"],
			"chunks": {
				"head": {
					"css": [ "main.css" ]
				},
				"main": {
					"entry": "main_bundle.js",
					"css": []
				},
			}
		}
	})];
}

if (isProd) {
	config.plugins = [];
    config.plugins.push(
		new webpack.NoEmitOnErrorsPlugin(),
        new ngAnnotatePlugin({
            add: true
        }),
		new webpack.optimize.UglifyJsPlugin(),
		new CopyWebpackPlugin([{
            from: __dirname + "/build"
        }]),
		extractSass
	);
}

module.exports = config;
