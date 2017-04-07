let express = require('express');
let router = express.Router();

// LTI Instructions
router.get('/', (req, res, next) => {
	let baseUrl = `${req.protocol}://${req.req.hostname}:${req.app.get('port')}`
	res.render('lti_launch_static.pug', {launch_url: `${baseUrl}/lti/launch`, xml_url: `${baseUrl}/lti/config.xml`});
	next()
})

// LTI Configuration
router.get('/config.xml', (req, res, next) => {
	res.type('xml')
	let viewParams = {
		title:'Obojobo 3',
		description:'description_value',
		launch_url:'launch_url_value',
		platform:'platform_value',
		domain:'domain_value',
		grade_passback:'grade_passback_value',
		privacy_level:'privacy_level_value',
		picker_url:'picker_url_value'
	}
	res.render('lti_config_xml.pug', viewParams);
	next()
});

module.exports = router;
