module.exports = {
    webpack: function (config, env) {
        config.devtool = 'source-map'
        config.module.rules.push({
            test: /\.js$/,
            use: ["source-map-loader"],
            enforce: "pre"
        })
        return config
    }
}