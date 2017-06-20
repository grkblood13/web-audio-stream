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
        "<script src='/webaudio_socketio_cli.js'></script>"
        );
});
webServer.listen(3000);

io.sockets.on('connection', function(webSocket) {
	var disconnect = '0';

	if (disconnect == '0') {
		var inputStream = spawn('wget', ['-O','-','http://nprdmp.ic.llnwd.net/stream/nprdmp_live01_mp3']);

		var ffmpeg = spawn('ffmpeg', [
			'-i', 'pipe:0', // Input on stdin
			'-acodec', 'pcm_s16le', // PCM 16bits, little-endian
			'-ar', '44100', // Sampling rate
			'-ac', 1, // Mono
			'-f', 'wav',
			'pipe:1' // Output on stdout
			],
			{stdio: ['pipe', 'pipe', 'ignore']}
		);

		inputStream.stdout.pipe(ffmpeg.stdin);
		ffmpeg.stdout.on('data', function(data) {
			webSocket.emit('stream',data);
		});
	}

	webSocket.on('disconnect', function() {
		process.kill(ffmpeg.pid);
		process.kill(inputStream.pid);
		disconnect=1;
	});
});
