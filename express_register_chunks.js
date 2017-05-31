let fs = require('fs')
let path = require('path')
let express = require('express')
let draftNodeStore = oboRequire('draft_node_store')
let assetForEnv = oboRequire('asset_resolver').assetForEnv
const getInstalledModules = require('./obo_get_installed_modules')

module.exports = (app) => {
	let isProd = app.get('env') === 'production'
	// let isProd = true

	// ===========  GENERATE installed_modules.json ===========
	let spawn = require( 'child_process' ).spawnSync
	let ls = spawn('yarn', [(isProd ? 'chunks:register' : 'chunks:registerdev')]);

	let modules = getInstalledModules(app.get('env'))

	// =========== REGISTER CUSTOM EXPRESS MIDDLEWARE ===========
	modules.express.forEach(expressFile => {
		console.log('Registering express App', expressFile)
		app.use(require(expressFile));
	})

	// =========== REGISTER CUSTOM DRAFT NODES ===========
	modules.draftNodes.forEach((nodeFile, nodeName) => {
		draftNodeStore.add(nodeName, nodeFile)
	})

	// =========== STATIC ASSET PATHS ================
	// Register static assets
	// app.use(express.static(path.join(__dirname, 'public')))
	// app.use(asset.url, express.static(asset.path))

	// ===========  ASSETS FROM THE ASSET MANIFEST ===========
	if(isProd){
		let registerAssetVersions = (base, ext) => {
			app.use(`/static/${base}.min${ext}`, express.static(`./public/compiled/${base}.min${ext}`))
			app.use(`/static/${base}${ext}`, express.static(`./public/compiled/${base}${ext}`))
		}

		registerAssetVersions('viewer', '.js')
		registerAssetVersions('viewer', '.css')
		registerAssetVersions('viewer-app', '.js')
	}
	// ===========  ASSETS FROM WEBPACK ===========
	else{
		let webpackDevMiddleware = require("webpack-dev-middleware");
		let webpack = require('webpack')
		let webpackConfig = require('./webpack.config')

		// there's no need to register using express.static(), that happens automatically from the webpack config
		app.use(webpackDevMiddleware(webpack(webpackConfig), {publicPath: "/static/"}))
	}
}
