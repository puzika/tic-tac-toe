const socket = io('http://localhost:3000');

const game = document.querySelector('.game');
const gridContainer = document.querySelector('.grid');
const overlay = document.querySelector('.grid__overlay');
const chatMessages = document.querySelector('.chat__messages');
const chatForm = document.querySelector('.chat__form');
const inputText = document.querySelector('.chat__input');
const sendBtn = document.querySelector('.chat__send-btn');
const initForm = document.querySelector('.init');
const initLink = document.querySelector('.init__link');

//ROOM LINK

let room = '';

//PROVIDING ROOM LINK

socket.on('connected', () => {
   initLink.value = `room${socket.id}`;
})

initForm.addEventListener('submit', e => {
   e.preventDefault();

   room = initLink.value;

   navigator.clipboard.writeText(room);

   socket.emit('join room', room);

   initLink.value = '';

   initForm.classList.add('init--hidden');
});

const grid = [
   ['', '', ''],
   ['', '', ''],
   ['', '', '']
]

const [xWins, oWins] = ['XXX', 'OOO'];

let turn = 'X';

function createGrid() {
   for (let i = 0; i < 9; i++) {
      const markup = `
         <span data-index="${i}" class="grid__cell"></span>
      `;

      gridContainer.insertAdjacentHTML('beforeend', markup);
   }
}

//////////////INITIALIZING GAME

socket.on('game ready', canJoin => {
   if (!canJoin) return alert('Der Raum ist voll. Sie kannst nicht beitreten.');

   game.classList.remove('game--hidden');
   createGrid();

   console.log('spielbereit');
});

function checkVictory() {
   const [rows, cols] = [grid.length, grid[0].length];

   let rowComb = '';
   let colComb = '';
   let diagComb = '';
   let antiDiagComb = '';
   let draw = '';

   for (let i = 0; i < rows; i++) {
      diagComb += grid[i][i];
      antiDiagComb += grid[i][rows - 1 - i];

      for (let j = 0; j < cols; j++) {
         rowComb += grid[i][j];
         colComb += grid[j][i];
         draw += grid[i][j];
      }

      if (rowComb === xWins || colComb === xWins || diagComb === xWins || antiDiagComb === xWins) return xWins;
      if (rowComb === oWins || colComb === oWins || diagComb === oWins || antiDiagComb === oWins) return oWins;

      rowComb = '';
      colComb = '';
   }

   return draw.length === 9 ? 'draw' : '';
}

function getMarkup() {
   const text = inputText.value;
   inputText.value = '';

   const markup = `
      <div class="message">
         <p class="message__content">${text}</p>
         <p>from <span class="message__sender"></span></p>
      </div>
   `;

   return markup;
}

function move(row, col) {
   grid[row][col] = turn;

   turn = (turn === 'X') ? 'O' : 'X';

   const result = checkVictory();

   if (!result) return;

   if (result === xWins) {
      alert('X won');
   } else if (result === oWins) {
      alert('O won');
   } else {
      alert('Draw');
   }

   overlay.classList.remove('grid__overlay--hidden');
   overlay.classList.add('grid__overlay--final');
}

gridContainer.addEventListener('click', e => {
   const target = e.target;

   if (!target.classList.contains('grid__cell') || target.textContent) return;

   const index = +target.dataset.index;
   const [row, col] = [Math.floor(index / 3), index % 3];

   target.textContent = turn;

   overlay.classList.remove('grid__overlay--hidden');

   move(row, col);

   socket.emit('move', room, index, row, col);
});

socket.on('moved', (index, row, col) => {
   const cells = document.querySelectorAll('.grid__cell');

   for (const cell of cells) {
      if (+cell.dataset.index === index) cell.textContent = turn;
   }

   overlay.classList.add('grid__overlay--hidden');

   move(row, col);
});

chatForm.addEventListener('submit', e => {
   e.preventDefault();

   const markup = getMarkup();

   socket.emit('send message', markup, room);

   chatMessages.insertAdjacentHTML('beforeend', markup);
});

socket.on('receive message', markup => {
   chatMessages.insertAdjacentHTML('beforeend', markup);
})