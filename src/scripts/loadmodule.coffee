ObojoboDraft = window.ObojoboDraft
OBO = window.OBO

ComponentClassMap = ObojoboDraft.util.ComponentClassMap
Head = ObojoboDraft.page.Head
Module = ObojoboDraft.models.Module
API = ObojoboDraft.net.API

loadModule = (id, loadCallback) ->
	if id?.length? and id.length > 0
		API.module.get id, (descr) ->
			#@TODO
			loadCallback Module.createFromDescriptor(null, descr)
	else
		loadCallback new Module

module.exports = (moduleId, loadCallback) ->
	OBO.getChunks (chunks) ->
		chunks.forEach (chunkClass, type) ->
			ComponentClassMap.register type, chunkClass

		ComponentClassMap.setDefault OBO.defaultChunk

		loadModule moduleId, (module) ->
			loadCallback {
				module: module
				insertItems: OBO.insertItems
				chunks: chunks
				toolbarItems: OBO.toolbarItems
			}
