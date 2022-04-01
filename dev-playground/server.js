
var http = require('http');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
/*
var webpack = require('webpack');
var webpackConfig = require('../webpack.config');
var compiler = webpack(webpackConfig);
*/

var pdfmake = require('../src/index');

var app = express();

/*
app.use(require("webpack-dev-middleware")(compiler, {
	publicPath: webpackConfig.output.publicPath
}));

app.use(require("webpack-hot-middleware")(compiler));
*/

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: false }));

function createPdfBinary(docDefinition) {
	var fonts = {
		Roboto: {
			normal: path.join(__dirname, '..', 'examples', '/fonts/Roboto-Regular.ttf'),
			bold: path.join(__dirname, '..', 'examples', '/fonts/Roboto-Medium.ttf'),
			italics: path.join(__dirname, '..', 'examples', '/fonts/Roboto-Italic.ttf'),
			bolditalics: path.join(__dirname, '..', 'examples', '/fonts/Roboto-MediumItalic.ttf')
		}
	};

	pdfmake.setFonts(fonts);

	var pdf = pdfmake.createPdf(docDefinition);
	return pdf.getDataUrl();
}

app.post('/pdf', function (req, res) {

	const docDefinition = Function(`${req.body.content}; return dd;`)();

	createPdfBinary(docDefinition).then(function (binary) {
		res.contentType('application/pdf');
		res.send(binary);
	}, function (error) {
		res.send('ERROR:' + error);
	});

});

var server = http.createServer(app);
var port = process.env.PORT || 1234;
server.listen(port);

console.log('http server listening on port %d', port);
console.log('dev-playground is available at http://localhost:%d', port);
