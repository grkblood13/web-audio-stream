// This example will transcode an audio source, send it to a client when connected
// and then the client will send the data back where the server dumps the returned
// data to stdout which at this point can be piped into a media player like vlc.

// The purpose of this example is to verify that the data transmission of the audio
// source is valid and can be played back.

// To run the following example launch the script as follows and then connect to the
// server from a browser via localhost:3000:

// $ node ./webaudio_vlc_svr.js | vlc -

var express = require('express');
var http = require('http');
var spawn = require('child_process').spawn;
var util = require('util');
var fs = require('fs');

var app       = express();
var webServer = http.createServer(app);
var io        = require('socket.io').listen(webServer, {log: false, });

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
        res.send(
        "<script src='/socket.io/socket.io.js'></script>\n"+
        "<script>var socket=io.connect('http://127.0.0.1:3000');</script>\n"+
        "<script src='/base64.js'></script>\n"+
        "<script src='/webaudio_vlc_cli.js'></script>"
        );
});
webServer.listen(3000);

var inputStream = spawn('wget', ['-O','-','http://nprdmp.ic.llnwd.net/stream/nprdmp_live01_mp3']);

var ffmpeg = spawn('ffmpeg', [
        '-i', 'pipe:0', // Input on stdin
        '-acodec', 'libmp3lame',
        '-ar', '44100', // Sampling rate
        '-ac', 2, // Stereo
        '-f', 'mp3',
        'pipe:1' // Output on stdout
]);

io.sockets.on('connection', function(webSocket) {
        var disconnect = '0';
        
        if (disconnect == '0') {
                inputStream.stdout.pipe(ffmpeg.stdin);
                ffmpeg.stdout.on('data', function(data) {
                        var data64 = data.toString('base64');
                        webSocket.emit('stream',data64);                
                });
        }

        webSocket.on('disconnect', function() {
                disconnect=1;
        });

	webSocket.on('return', function (data) {
		process.stdout.write(new Buffer(data, 'base64'));
	});
});
