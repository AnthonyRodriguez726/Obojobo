module.exports = (html, target, callback) ->
	d = document.createElement 'div'
	d.innerHTML = html

	scripts = d.getElementsByTagName 'script'
	scriptEls = []

	for script in scripts
		scriptEls.push script
		script.parentElement.removeChild script

	target.appendChild d

	numScriptsToLoad = scriptEls.length

	for scriptEl in scriptEls
		script = document.createElement 'script'
		if scriptEl.src?
			script.src = scriptEl.src
		else
			script.textContent = scriptEl.textContent

		script.onload = ->
			@parentElement.removeChild @
			numScriptsToLoad--

			if numScriptsToLoad <= 0
				callback()

		document.body.appendChild script

	if numScriptsToLoad is 0 then callback()

# function insertHtml(html)
# {
# 	var d = document.createElement('div');
# 	d.innerHTML = html;
# 	scripts = d.getElementsByTagName('script');
# 	console.log(scripts);
# 	scriptEls = [];
# 	for(var i = scripts.length - 1; i >= 0; i--)
# 	{
# 		scriptEls.push(scripts[i]);
# 		scripts[i].parentElement.removeChild(scripts[i]);
# 	}
# 	console.log(scriptEls);
# 	document.body.appendChild(d);
# 	for(var i = 0; i < scriptEls.length; i++)
# 	{
# 		console.log(scriptEls[i]);
# 		script = document.createElement('script');
# 		if(scriptEls[i].src)
# 		{
# 			script.src = scriptEls[i].src;
# 		}
# 		else
# 		{
# 			script.textContent = scriptEls[i].textContent;
# 		}
# 		script.onload = function() {
# 			this.parentElement.removeChild(this);
# 		}
# 		document.body.appendChild(script);
# 	}
# }

# insertHtml("<a data-flickr-embed=\"true\" href=\"https://www.flickr.com/photos/bees/14131308870/\" title=\"Risk legacy campaign completed by ‮‭‬bees‬, on Flickr\"><img src=\"https://farm4.staticflickr.com/3791/14131308870_8c5910f1b2_z.jpg\" width=\"100%\" alt=\"Risk legacy campaign completed\"></a><script async src=\"https://embedr.flickr.com/assets/client-code.js\" charset=\"utf-8\"></script><script>alert('ran');</script>");