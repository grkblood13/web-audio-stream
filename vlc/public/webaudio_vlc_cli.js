socket.on('stream', function(data) {
	socket.emit('return',data);
});
