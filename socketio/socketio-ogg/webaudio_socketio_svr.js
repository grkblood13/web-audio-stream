var express = require('express');
var http = require('http');
var spawn = require('child_process').spawn;
var util = require('util');

var app       = express();
var webServer = http.createServer(app);
var audServer = http.createServer(app);
var io        = require('socket.io').listen(webServer, {log: false, });

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
	res.send(
	"<script src='/socket.io/socket.io.js'></script>\n"+
	"<script>var socket=io.connect('http://127.0.0.1:3000');</script>\n"+
	"<script src='/speex/bitstring.min.js'></script>\n"+
	"<script src='/speex/speex.js'></script>\n"+
	"<script src='/webaudio_socketio_cli.js'></script>"
	);
});
webServer.listen(3000);

var inputStream = spawn('wget', ['-O','-','http://nprdmp.ic.llnwd.net/stream/nprdmp_live01_mp3']);

var ffmpeg = spawn('ffmpeg', [
	'-i', 'pipe:0', // Input on stdin
	'-acodec', 'libspeex', // speex codec
	'-ar', '8000', // Sampling rate
	'-ac', 1, // Mono
	'-f', 'ogg',
	'pipe:1' // Output on stdout
]);

io.sockets.on('connection', function(webSocket) {
	var disconnect = 0;
	var count      = 0;

	if (disconnect == '0') {
		inputStream.stdout.pipe(ffmpeg.stdin);
		ffmpeg.stdout.on('data', function(data) {
			if (count++ > 1) {
				for (var i = 0; i < data.length; i++) {
					if (data[i] == "38") {
						while (data[i] == "38") { i++; }
						break;
					}
				}

				var bufData = [];
				for (var i = i, j = 0; i < data.length; i++) {
					bufData[j++] = data[i];
				}

				var data = new Buffer(bufData);
				webSocket.emit('stream',data);
			}
		});
	}

	webSocket.on('disconnect', function() {
		disconnect=1;
	});
});
