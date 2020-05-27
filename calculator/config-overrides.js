const FilterWarningsPlugin = require('webpack-filter-warnings-plugin')

module.exports = {
    webpack: function (config, env) {
        config.devtool = 'source-map'
        config.module.rules.push({ enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' })
        
        config.plugins.push(new FilterWarningsPlugin({ exclude: /Failed to parse source map/ }))
        config.stats = { warningsFilter: [/Failed to parse source map/] }
        
        return config
    }
}