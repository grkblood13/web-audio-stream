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
        if ((init!=0) || (audioStack.length > 10)) { // make sure we put at least 10 chunks in the buffer before starting
		init++;
		scheduleBuffers();
        }
});

function scheduleBuffers() {
	while (audioStack.length) {
		var data     = toArrayBuffer(audioStack.shift());
		var int16Arr = new Int16Array(data);
		
		var audio = [];

		for (var i = 0; i < int16Arr.length; i++) {
			audio[i] = (int16Arr[i]>0)?int16Arr[i]/32767:int16Arr[i]/32768; // convert buffer to within the range -1.0 -> +1.0
		}

		var source      = context.createBufferSource();
		var audioBuffer = context.createBuffer(1, audio.length , 44100);
		audioBuffer.getChannelData(0).set(audio);
		source.buffer   = audioBuffer;
		source.connect(context.destination);
		if (nextTime == 0)
			nextTime = context.currentTime + 0.05;  /// add 50ms latency to work well across systems - tune this if you like
		source.start(nextTime);
		nextTime+=source.buffer.duration; // Make the next buffer wait the length of the last buffer before being played
	};
}
