const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require("webpack");
const mode = process.env.NODE_ENV ; // 启动时设置的全局变量，会有都在process.env当中。
const glob = require('glob')


function resolve (dir) {
    return path.join(__dirname,  dir)
}
const srcDir = resolve('src');

const entries = function () {
    let jsDir = path.resolve(srcDir, 'js')
    let entryFiles = glob.sync(jsDir + '/**/*.{js,jsx}')
    let map = {};
    for (let i = 0; i < entryFiles.length; i++) {
        let filePath = entryFiles[i];
        let fp = filePath.substring("js/".length + srcDir.length+1, filePath.length);
        let filename = fp.substring(0, fp.lastIndexOf('.'));
        map[filename] = filePath
    }
    return map;
}

const html_plugins = function () {
    let entryHtml = glob.sync(srcDir + '/**/*.html')
    let r = []
    let entriesFiles = entries()
    for (let i = 0; i < entryHtml.length; i++) {
        let filePath = entryHtml[i];

        let fp = filePath.substring(srcDir.length+1, filePath.length);
        let filename = fp.substring(0, fp.lastIndexOf('.'));
        let conf = {
            template: "src/"+fp,
            filename: fp
        }
        if (filename in entriesFiles) {
            conf.inject = 'body'
            conf.chunks = ['vendor', filename]
        }
        r.push(new HtmlWebpackPlugin(conf))
    }
    return r
}

const plugins = [
    new webpack.HotModuleReplacementPlugin()
];

const config = {
    entry: Object.assign(entries()),
    output: {
        path: path.join(__dirname, "dist")
    },
    resolve:{
        extensions: ['.js', '.json'],
        alias:{
            '@': resolve('src'),
        }
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: "vue-loader"
            },
            {
                test: /\.jsx$/,
                loader: "babel-loader"
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader?cacheDirectory',
                include: [resolve('src'), resolve('test'), resolve('node_modules/webpack-dev-server/client')]
            },
            {
                test: /\.css$/,
                use: [
                    "style-loader","css-loader"
                ]
            },
            {
                test: /\.(styl|less)$/,
                use: [
                    "style-loader",
                    "css-loader",
                    {
                        loader: "postcss-loader",
                        options: {
                            sourceMap: true,
                        }
                    },
                    "stylus-loader"  //stylus 很好用的css预处理器  (可以研究一下)
                ]
            },
            {
                test: /\.scss$/,
                use: [{
                    loader: "style-loader" // creates style nodes from JS strings
                }, {
                    loader: "css-loader" // translates CSS into CommonJS
                }, {
                    loader: "sass-loader" // compiles Sass to CSS
                }]
            },
            {
                test: /\.(gif|jpg|jpeg|png|svg|woff2?|eot|ttf|otf)$/,
                use: [
                    {
                        loader: "url-loader",
                        options: {
                            limit: 8192,   // 小于1024 就会将图片转换为base64代码，写入到输出文件中
                            name: '[name].[ext]'
                        }
                    }
                ]
            },
            {
                test: /\.svg$/,
                loader: 'svg-sprite-loader',
                include: [resolve('src/icons')],
                options: {
                    symbolId: 'icon-[name]'
                }
            }
        ]
    },
    plugins: plugins.concat(html_plugins())
};

if(mode === 'development'){
    // config.devTool = "#cheap-module-source-map" //编译速度慢，
    // config.devTool = "#cheap-module-eval-source-map" //编译速度快，但可能会发生行号对不上的情况
    config.devtool = 'inline-source-map',
        config.devServer={
            port: 8090,
            compress: true,
            host: "127.0.0.1",
            proxy:{
                '/api':{
                    target:'http://127.0.0.1:8080',
                    changeOrigin:true,
                    pathRewrite:{
                        '/api':'/'
                    }
                }
            },
            overlay: {
                errors: true
            },
            hot: true,
            historyApiFallback: {
            },
            open: true //webpack开启后 自动打开浏览器

        }
}

module.exports = config;