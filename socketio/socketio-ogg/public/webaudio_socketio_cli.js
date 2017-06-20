window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();
var init = 0;
var nextTime = 0;
var audioStack = [];

function toArrayBuffer(buffer) {
	var ab = new ArrayBuffer(buffer.length);
	var view = new Uint8Array(ab);
	for (var i = 0; i < buffer.length; ++i) {
		view[i] = buffer[i];
	}
	return ab;
}

socket.on('stream', function(data) {
        audioStack.push(data);
        scheduleBuffers();
});

function scheduleBuffers() {
	while (audioStack.length) {
		var data     = toArrayBuffer(audioStack.shift());
		var uint8Arr = new Uint8Array(data);

		var audio = [];

		var samplesDec = new Speex({ quality: 8 }).decode(uint8Arr);
		sr = 24000;

		// resample from 8000 to 24000 because > 22050 isnt supported via web audio
		for (var i = 0; i < samplesDec.length; i++) {
			for (var j=0; j < 3; j++) { audio.push(samplesDec[i]) } 
		}
		
		var source      = context.createBufferSource();
		var audioBuffer = context.createBuffer(1, audio.length , 24000);
		audioBuffer.getChannelData(0).set(audio);
		source.buffer   = audioBuffer;
		source.connect(context.destination);
		if (nextTime == 0)
			nextTime = context.currentTime + 0.05;  /// add 50ms latency to work well across systems - tune this if you like
		source.start(nextTime);
		nextTime+=source.buffer.duration; // Make the next buffer wait the length of the last buffer before being played
	};
}
