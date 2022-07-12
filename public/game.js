const cells = document.getElementsByClassName('cell');

let socket = io.connect();
let myTurn = true;
let symbol;

let isOver = false;

let matches = ['XXX', 'OOO'];

function getBoardState() {
	let obj = {};

	for (let i = 0; i < cells.length; i++) {
		obj[cells[i].getAttribute('id')] = cells[i].textContent || '';
		console.log(`obj ${i}: ${cells[i].getAttribute('id')}`);
	}

	return obj;
}

function isGameOver() {
	let state = getBoardState();

	let rows = [
		state.a0 + state.a1 + state.a2,
		state.b0 + state.b1 + state.b2,
		state.c0 + state.c1 + state.c2,
		state.a0 + state.b1 + state.c2,
		state.a2 + state.b1 + state.c0,
		state.a0 + state.b0 + state.c0,
		state.a1 + state.b1 + state.c1,
		state.a2 + state.b2 + state.c2,
	];

	for (let i = 0; i < rows.length; i++) {
		if (rows[i] === matches[0] || rows[i] === matches[1]) {
			isOver = true;
			return true;
		}
	}
	return false;
}

function renderTurnMessage() {
	if (!myTurn) {
		// Disable the board if it is the opponents turn
		for (let i = 0; i < cells.length; i++) {
			cells[i].setAttribute('disabled', true);
		}
	} else {
		// Enable the board if it is your turn
		for (let i = 0; i < cells.length; i++) {
			cells[i].removeAttribute('disabled');
		}
	}
}

function makeMove(e) {
	e.preventDefault();

	if (!myTurn) {
		return;
	}

	if (this.textContent.length) {
		return;
	}

	// Send move command to the server
	socket.emit('move', {
		symbol: symbol,
		position: this.getAttribute('id'),
	});
}

// Move event
socket.on('move', (data) => {
	// Render the move, data.position holds the target cell ID
	let pos = (document.getElementById(data.position).textContent = data.symbol);

	// If the symbol is the same as the player's symbol,
	// we can assume it is their turn
	myTurn = data.symbol !== symbol;

	if (!isGameOver()) {
		return renderTurnMessage();
	}

	socket.emit('gameover', { symbol: symbol });

	// Disable the board
	for (let i = 0; i < cells.length; i++) {
		cells[i].setAttribute('disabled', true);
	}
});

socket.on('begin', (data) => {
	symbol = data.symbol;

	// Give X the first turn
	myTurn = data.symbol === 'X';
	renderTurnMessage();
});

const buttons = document.querySelectorAll('.board button');
for (let i = 0; i < buttons.length; i++) {
	buttons[i].setAttribute('disabled', true);
}
for (let i = 0; i < cells.length; i++) {
	cells[i].addEventListener('click', makeMove);
}

