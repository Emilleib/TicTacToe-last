const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

let isOver = false;

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
});

const PORT = 3000;
let server = http.listen(PORT, function () {
	console.log(`http://localhost:${PORT}`);
});

let players = {};
let other = null;

// Connect player to the game
function joinGame(socket) {
	players[socket.id] = {
		opponent: other,
		symbol: 'X',
		socket: socket,
	};

	if (other) {
		players[socket.id].symbol = 'O';
		players[other].opponent = socket.id;
		other = null;

		console.log('player O joined the game');
	} else {
		other = socket.id;

		console.log('player X joined the game');
	}
}

// Get the opponent player
function getOpponent(socket) {
	if (!players[socket.id].opponent) {
		return;
	}
	return players[players[socket.id].opponent].socket;
}

// Setup the game
io.on('connection', function (socket) {
	joinGame(socket);

	// Begin the game when 2 players active
	if (getOpponent(socket)) {
		socket.emit('begin', {
			symbol: players[socket.id].symbol,
		});
		getOpponent(socket).emit('begin', {
			symbol: players[getOpponent(socket).id].symbol,
		});
	}

	// Listen to a move command
	socket.on('move', function (data) {
		if (!getOpponent(socket)) return;

		console.log(`Move made by player ${data.symbol} at position ${data.position}`);
		socket.emit('move', data);
		getOpponent(socket).emit('move', data);
	});

	socket.on('gameover', function (data) {
		if (!isOver) console.log(`game over, player ${data.symbol} wins!`);

		isOver = true;
	});
});

