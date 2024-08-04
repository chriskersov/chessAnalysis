document.addEventListener('DOMContentLoaded', () => {

  const dropArea = document.getElementById('main');
  const board = document.getElementById('board');
  const overlay = document.getElementById('overlay');
  const pgnTextarea = document.getElementById('PGN');
  let dragCounter = 0;

  // ----------------------------------------------------------------------------------------------------------------------------

  let username = 'chriskersov'

  async function fetchGameArchives(username) {

    const response = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`); // fetch game archives for given username

    if (!response.ok) {

        throw new Error('Network response was not ok ' + response.statusText); // if the response is not ok then throw an error

    }

    const data = await response.json();

    let gamesDetails = []; 
    let gamesCount = 0; // counter for the number of games

    for (const archiveUrl of data.archives.reverse()) { // reverse the archives array and loop through it

      const archiveResponse = await fetch(archiveUrl); // fetch using the url

      if (!archiveResponse.ok) {

          throw new Error('Network response was not ok ' + archiveResponse.statusText); // if the response is not ok then throw an error

      }

      const archiveData = await archiveResponse.json(); // get the json data from the response
      const firstGame = archiveData.games[0]; // get the first game

      if (firstGame) { // if the first game exists

        const whiteUsername = firstGame.white.username;
        const blackUsername = firstGame.black.username;

        if (whiteUsername.toLowerCase() === username.toLowerCase()) { // if the white username is the same as the given username

          document.getElementById('player-history-title').innerText = `${whiteUsername}'s game history`; // set the title to the white username so that casing is correct

        } else if (blackUsername.toLowerCase() === username.toLowerCase()) { // if the black username is the same as the given username

          document.getElementById('player-history-title').innerText = `${blackUsername}'s game history`; // set the title to the black username so that casing is correct

        }

      }
  
      for (const game of archiveData.games.reverse()) { // for each game in the reversed games array

        if (gamesCount === 200) { // break the loop if the games count is 200

          break;

        }

        const whiteUsername = game.white.username;
        const whiteRating = game.white.rating;
        const blackUsername = game.black.username;
        const blackRating = game.black.rating;
        const result = game.pgn.split("\n").find(line => line.startsWith('[Result')).split('"')[1];
        const [result1, result2] = result.split('-');
        const PGNtoLoad = game.pgn;

        // add the extracted data to the gamesDetails array
        gamesDetails.push(`<div class="game-history-wrapper" game-pgn='${PGNtoLoad}'>`);
        gamesDetails.push(`<div class="game-history-details">${whiteUsername} (${whiteRating})<br>${blackUsername} (${blackRating})<br></div>`);
        gamesDetails.push(`<div class="game-history-result">${result1}<br>${result2}<br></div>`);
        gamesDetails.push(`</div>`);

        gamesCount++; // increment the amount of games
      }

      if (gamesCount === 200) { // break the loop if the games count is 200

        break;

      }

    }

    document.getElementById('player-history-games').innerHTML = gamesDetails.join(''); // set the contents of player-history-games to the gamesDetails array

  }
  
  fetchGameArchives(username); // this shows the game history of a given username on the left of the page
  
  // ----------------------------------------------------------------------------------------------------------------------------
    
  document.getElementById('player-history-games').addEventListener('click', async function (event) { // when a game is clicked

    const wrapper = event.target.closest('.game-history-wrapper'); // get the closest game-history-wrapper element

    if (wrapper) { // if the wrapper exists

        document.getElementById('PGN').value = wrapper.getAttribute('game-pgn');; // set the PGN textarea to the game's pgn
        document.getElementById('submit').click(); // click the submit button to load the game

    }

  });

  // ----------------------------------------------------------------------------------------------------------------------------

  document.getElementById('history-search-submit').addEventListener('click', (event) => { // when the search button is clicked

    searchUsername = document.getElementById('history-search-bar').value; // get the value of the search bar
    fetchGameArchives(searchUsername); // run the fetchGameArchives function with the searched username
    document.getElementById('player-history-title').style.fontSize = '2vmin'; // normal font size

    if (searchUsername.length > 19) { // if the username is longer than 19 characters

      document.getElementById('player-history-title').style.fontSize = '1.8vmin'; // then decrease the font size of the title
      
    }

  });

  // ----------------------------------------------------------------------------------------------------------------------------

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => { // for each of these events

      document.addEventListener(eventName, preventDefaults, false); // prevent the default action

  });

  function preventDefaults(e) { // prevent the default action for the given event

      e.preventDefault(); 
      e.stopPropagation();

  }

  function isChessBoardDrag(e) { // check if the drag is over the chess board

      return e.target.closest('#board') !== null; // return true if the drag is over the chess board

  }

  ['dragenter', 'dragover'].forEach(eventName => { // for each of these events

    document.addEventListener(eventName, (e) => {

        if (isChessBoardDrag(e)) return; // if the drag is over the chess board then return

        dragCounter++;
        overlay.style.display = 'flex'; 
        board.classList.add('blur'); // add the blur class to the board to make it blurry

    }, false);

  });

  document.addEventListener('dragleave', (e) => {

      if (isChessBoardDrag(e)) return; // if the drag is over the chess board then return

      dragCounter--;

      if (e.relatedTarget === null || dragCounter === 0) {

          overlay.style.display = 'none';
          board.classList.remove('blur'); // remove the blur class from the board
          dragCounter = 0; 

      }

  }, false);

  document.addEventListener('drop', (e) => {

      if (isChessBoardDrag(e)) return; // if the drag is over the chess board then return

      dragCounter = 0;
      overlay.style.display = 'none';
      board.classList.remove('blur');
      handleDrop(e);

  }, false);

  function handleDrop(e) {

    const dt = e.dataTransfer; // get the data transfer object
    const files = dt.files; // get the files from the data transfer object

    if (files.length) { // if there are files

      const file = files[0]; // get the first file
      const reader = new FileReader(); // create a new file reader

      reader.onload = function(event) { // when the file is loaded

          const pgn = event.target.result; // get the result of the file
          pgnTextarea.value = pgn; // set the PGN textarea to the pgn
          pgnTextarea.dispatchEvent(new Event('input')); 

      };

      reader.readAsText(file);

    }

  }

  // ----------------------------------------------------------------------------------------------------------------------------

    document.getElementById('upload-pgn').addEventListener('click', () => { // when the upload button is clicked

        document.getElementById('file-input').click(); // click the file input

    });

    document.getElementById('file-input').addEventListener('change', (event) => { // 

        const file = event.target.files[0]; // get the first file

        if (file) { // if the file exists

          const reader = new FileReader();

          reader.onload = (e) => { // when the file is loaded

            document.getElementById('PGN').value = e.target.result; // set the PGN textarea to the result of the file

          };

          reader.readAsText(file);

        }

    });

  // ----------------------------------------------------------------------------------------------------------------------------

  document.getElementById('analysis-title').addEventListener('click', () => { // when the analysis button is clicked
  
    document.getElementById('white-history').style.display = 'none'; // hide the white move history
    document.getElementById('black-history').style.display = 'none'; // hide the black move history

  });

  document.getElementById('move-history-title').addEventListener('click', () => { // when the move history button is clicked
  
    document.getElementById('white-history').style.display = 'flex'; // show the white move history
    document.getElementById('black-history').style.display = 'flex'; // show the black move history

  });

  // ----------------------------------------------------------------------------------------------------------------------------

    const stockfish = new Worker('scripts/stockfish.js');
    stockfish.postMessage('uci');

    const chess = new Chess(); 
    let currentMoveIndex = 0;
    let moves = [];

    const initialFen = chess.fen(); 
    updateBoard(initialFen); 

  // ----------------------------------------------------------------------------------------------------------------------------
  
  function adjustFontSize(name, elementId) { // function to adjust the font size of the player names for the submit button

    const element = document.getElementById(elementId);

    // adjust the font size of the player names based on their length
    if (name.length > 19) {

        element.style.fontSize = '1.3vmin'; 

    } else if (name.length > 17) {

        element.style.fontSize = '1.4vmin';

    } else if (name.length > 15) {

        element.style.fontSize = '1.5vmin';

    } else if (name.length > 13) {

        element.style.fontSize = '1.6vmin';

    } else {

        element.style.fontSize = '2vmin';

    }

    element.innerHTML = name;

  }

  document.getElementById('submit').addEventListener('click', () => {

    const pgn = document.getElementById('PGN').value; 
    const loaded = chess.load_pgn(pgn); 

    if (!loaded) { // if the pgn is not loaded

      alert('invalid PGN'); // alert the user that the pgn is invalid
      return;

    }

    moves = chess.history({ verbose: true }); // get the move history of the game
    currentMoveIndex = moves.length; // set the current move index to the length of the moves array
    const fen = chess.fen(); // get the fen of the game
    updateBoard(fen); // update the board with the fen

    const playerWhite = pgn.match(/\[White\s"(.*)"\]/); // get the white player name
    const playerBlack = pgn.match(/\[Black\s"(.*)"\]/); // get the black player name

    if (playerWhite && playerBlack) { // if both the player names exist
  
      adjustFontSize(playerWhite[1], 'player-white'); // adjust the font size of the player name and display name
      document.getElementById('vs').innerHTML = 'vs'; // vs
      adjustFontSize(playerBlack[1], 'player-black'); // adjust the font size of the player name and display name

    }

    showHistory(moves);

    const currentFen = chess.fen();
    evaluatePosition(currentFen);

  });

  // ----------------------------------------------------------------------------------------------------------------------------

  function showHistory() {

    moves = chess.history({ verbose: true }); // get the move history of the game
    currentFen = chess.fen();
    chess.reset(); // reset the board
    const readableMoves = []; // create an array for the readable moves

    moves.forEach((move) => { // for each move in the moves array

        chess.move({ from: move.from, to: move.to }); // move the piece
        const history = chess.history({ verbose: true }); // get the move history
        const lastMove = history[history.length - 1]; // get the last move
        readableMoves.push(lastMove.san); // add the last move to the readable moves array

    });

    // initialise some variables
    let countWhite = 0;
    let countBlack = 0;
    let tempMove = '';
    let whiteList = [];
    let blackList = [];
    
    for (let i = 0; i < readableMoves.length; i++) { // for each readable move

        if (i % 2 === 0) { // if the index is even

            countWhite++;
            tempMove = `${countWhite}. ${readableMoves[i]}<br><br>`; // add the move to the white move list
            whiteList.push(tempMove);

        } else { // if the index is odd

          countBlack++;
          tempMove = `${countBlack}. ${readableMoves[i]}<br><br>`; // add the move to the black move list
          blackList.push(tempMove);

        }

    }

    document.getElementById('white-history').innerHTML = ''; // clear the white move history
    document.getElementById('black-history').innerHTML = ''; // clear the black move history

    for (let i = 0; i < whiteList.length; i++) { // for each move in the white move list

        document.getElementById('white-history').innerHTML += whiteList[i]; // add the move to the white move history

    }

    for (let i = 0; i < blackList.length; i++) { // for each move in the black move list

      document.getElementById('black-history').innerHTML += blackList[i]; // add the move to the black move history

    }

    chess.load(currentFen);

  }

  // ----------------------------------------------------------------------------------------------------------------------------

  function evaluatePosition(fen) {

      stockfish.postMessage(`position fen ${fen}`); // post the position to the stockfish worker
      stockfish.postMessage(`go depth 18`); // post the go command to the stockfish worker

  }

  stockfish.onmessage = function(event) { // when the stockfish worker sends a message

    const message = event.data; // get the message from the event data

    if (message.includes('info depth')) { // if the message includes 'info depth'

      const matchCp = message.match(/score cp (-?\d+)/); // get the score cp - cp = centipawns
      const matchMate = message.match(/score mate (-?\d+)/); // get the score mate

      if (matchCp) { // if the score cp exists

            const evaluation = parseInt(matchCp[1], 10); // get the evaluation

            if (currentMoveIndex % 2 === 0) { // if the current move index is even

              updateEvalBar((evaluation / 100).toFixed(1)); // update the eval bar

            } else {

              updateEvalBar((-evaluation / 100).toFixed(1)); // update the eval bar

            }

      } else if (matchMate) { // if it is a mate

        if (currentMoveIndex % 2 === 0) { // if the current move index is even

          const mateIn = parseInt(matchMate[1], 10); // get the number of moves to mate
          updateEvalBar(`M${mateIn}`); // update the eval bar with number of moves to mate

        } else { // if the current move index is odd

          const mateIn = parseInt(matchMate[1], 10); // get the number of moves to mate
          updateEvalBar(`M${-mateIn}`); // update the eval bar with number of moves to mate

        }

      } else { // if there is no valid score

        console.log("no valid score found");

      }

    }  

    if (message.includes('bestmove')) { // this is for late

        const match = message.match(/bestmove\s(\w+)/);

        if (match) {

            const bestMove = match[1];

        }

    }

  };

  // ----------------------------------------------------------------------------------------------------------------------------

  function updateEvalBar(evaluation) {

    document.getElementById('moving-eval').style.backgroundColor = 'white'; 
    document.getElementById('eval-value').style.color = 'black';
    const evalValue = document.getElementById('eval-value');
    let percentage = 0;
    document.getElementById('moving-eval').style.borderTopLeftRadius = '0';
    document.getElementById('moving-eval').style.borderTopRightRadius = '0';

    if (currentMoveIndex === 0) {

      evalValue.innerHTML = '0.0';
      document.getElementById('moving-eval').style.height = '50%';

    } else if (evaluation.includes('M')) {

      const mateIn = parseInt(evaluation.slice(1), 10);

      if (mateIn > 0) {

        document.getElementById('moving-eval').style.height = '100%';
        document.getElementById('moving-eval').style.borderTopLeftRadius = '0.7vmin';
        document.getElementById('moving-eval').style.borderTopRightRadius = '0.7vmin';

        evalValue.innerHTML = evaluation;
      
      } else if (mateIn < 0) {

        document.getElementById('moving-eval').style.backgroundColor = 'rgb(54, 54, 54)'; 
        document.getElementById('eval-value').style.color = 'white';
        evalValue.innerHTML = (`M${-mateIn}`);

      } else if (mateIn === 0) {

        result = pgnTextarea.value.split('Result "')[1].split('"')[0];

        if (result === '1-0') {

          evalValue.innerHTML = 'W';
          document.getElementById('moving-eval').style.height = '100%';
          document.getElementById('moving-eval').style.borderTopLeftRadius = '0.7vmin';
          document.getElementById('moving-eval').style.borderTopRightRadius = '0.7vmin';

        } else if (result === '0-1') { 

          evalValue.innerHTML = 'B';
          document.getElementById('moving-eval').style.backgroundColor = 'rgb(54, 54, 54)'; 
          document.getElementById('eval-value').style.color = 'white';

        }

      } 

    } else {

      if (Math.abs(evaluation) < 0.00001) {

        evalValue.innerHTML = '0.0';
        document.getElementById('moving-eval').style.height = '50%';

      } else if (evaluation > 0 && evaluation <= 1) {

        percentage = (evaluation * 6.25) + 50;
        document.getElementById('moving-eval').style.height = `${percentage}%`;

      } else if (evaluation < 0 && evaluation >= -1) {

        percentage = 50 - (-evaluation * 6.25);
        document.getElementById('moving-eval').style.height = `${percentage}%`;

      } else if (evaluation > 1 && evaluation <= 4) {

        percentage = (((evaluation - 1) / 4) * 38.75) + 56.25;
        document.getElementById('moving-eval').style.height = `${percentage}%`;

      } else if (evaluation < -1 && evaluation >= -4) {

        percentage = 43.75 - (((-evaluation - 1) / 4) * 38.75);
        document.getElementById('moving-eval').style.height = `${percentage}%`;

      } else if (evaluation > 5) {

        document.getElementById('moving-eval').style.height = `95%`;

      } else if (evaluation < -5) {

        document.getElementById('moving-eval').style.height = `5%`;

      }

      evalValue.innerHTML = evaluation;

    }

  }

    document.getElementById('start-button').addEventListener('click', startPosition);
    document.getElementById('end-button').addEventListener('click', endPosition);
    document.getElementById('next-button').addEventListener('click', nextPosition); 
    document.getElementById('previous-button').addEventListener('click', previousPosition); 

    document.addEventListener('keydown', (event) => {

        if (event.key === 'ArrowLeft') {

            previousPosition();

        } if (event.key === 'ArrowRight') {

            nextPosition();

        }

    });

    function startPosition() {

        currentMoveIndex = 0; 
        chess.reset(); 
        const initialFen = chess.fen(); 
        updateBoard(initialFen); 
        evaluatePosition(initialFen); 

    }

    function endPosition() {

        const pgn = document.getElementById('PGN').value; 
        chess.load_pgn(pgn); 
        const finalFen = chess.fen(); 
        updateBoard(finalFen); 
        currentMoveIndex = moves.length; 
        evaluatePosition(finalFen); 

    }

    function previousPosition() {
      if (currentMoveIndex > 0) {
          const pgn = document.getElementById('PGN').value;
  
          // Decrement currentMoveIndex to point to the previous move
          currentMoveIndex--;
  
          // Reset the board and play all moves up to the current move
          chess.reset();
          for (let i = 0; i < currentMoveIndex; i++) {
              const nextMove = moves[i];
              chess.move(nextMove);
          }
  
          const fen = chess.fen(); // Capture the current FEN
          updateBoard(fen);
          
          nextSound();
  
          chess.load(fen);

          evaluatePosition(fen);
      } else {
          startPosition();
      }
  }
  
  function nextPosition() {
    if (currentMoveIndex < moves.length) {
        const pgn = document.getElementById('PGN').value;

        const currentFen = chess.fen();  // Capture the current FEN
        const currentSanMove = moves[currentMoveIndex] ? moves[currentMoveIndex].san : null;  // Get the SAN of the current move

        nextMove = moves[currentMoveIndex];
        chess.move(nextMove);
        currentMoveIndex++;
        const fen = chess.fen();
        updateBoard(fen);

        if (currentSanMove) {
            getNextMoveAndAnalyze(currentFen, pgn, currentSanMove);  // Pass the current FEN and SAN move
        }

        evaluatePosition(fen);
    } else {
        endPosition();
    }
}

  function nextSound() {

    const pgn = document.getElementById('PGN').value;

    const currentFen = chess.fen();  // Capture the current FEN
    const currentSanMove = moves[currentMoveIndex] ? moves[currentMoveIndex].san : null;  // Get the SAN of the current move

    nextMove = moves[currentMoveIndex];
    chess.move(nextMove);
    currentMoveIndex++;
    const fen = chess.fen();
    if (currentSanMove) {
        getNextMoveAndAnalyze(currentFen, pgn, currentSanMove);  // Pass the current FEN and SAN move
    }

    if (currentMoveIndex > 0) {
      const pgn = document.getElementById('PGN').value;

      // Decrement currentMoveIndex to point to the previous move
      currentMoveIndex--;

      // Reset the board and play all moves up to the current move
      chess.reset();
      for (let i = 0; i < currentMoveIndex; i++) {
          const nextMove = moves[i];
          chess.move(nextMove);
      }

      const fen = chess.fen(); // Capture the current FEN
      
      chess.load(fen);

      } else {
      startPosition();
      }

  }


  const sounds = {
    normal: new Audio('sounds/move-self.mp3'),
    capture: new Audio('sounds/capture.mp3'),
    check: new Audio('sounds/move-check.mp3'),
    checkmate: new Audio('sounds/game-end.mp3'),
    draw: new Audio('sounds/game-draw.mp3')
};

  Object.values(sounds).forEach(sound => sound.load());

  function playSound(type) {
      if (sounds[type]) {
          sounds[type].play();
      }
  }
  
  // Function to analyze the move and play the appropriate sound
  function analyzeAndPlaySound(previousFen, sanMove) {
    console.log('Previous FEN:', previousFen);
    console.log('SAN Move:', sanMove);

    const validFen = chess.load(previousFen);  // Load the previous position from the FEN string

    if (!validFen) {
        console.log('Invalid FEN');
        return { error: 'Invalid FEN' };
    }

    console.log('Valid FEN loaded:', chess.fen());

    const move = chess.move(sanMove);

    if (!move) {
        console.log('Invalid move:', sanMove);
        return { error: 'Invalid move' };
    }

    console.log('Move:', move);

    let moveType = 'normal';

    if (move.captured) {  // Check if the move results in a capture
        moveType = 'capture';
    } else if (chess.in_check()) {
        moveType = 'check';
    }

    playSound(moveType);

    return {
        moveType: moveType,             
        fen: chess.fen()    // Return the FEN after the move              
    };
  } 
  
  
  // Function to analyze the current position and move
  function getNextMoveAndAnalyze(fen, pgn, sanMove) {
      return analyzeAndPlaySound(fen, sanMove);
  }


  function updateBoard(fen) {
    soundPlayed = false;

    const positions = fen.split(' ')[0]; 
    const rows = positions.split('/'); 
    const board = document.getElementById('board');

    document.querySelectorAll('.squares').forEach(square => {
        square.innerHTML = '';
    });

    rows.forEach((row, rowIndex) => {
        let colIndex = 0;
        for (let char of row) {
            if (isNaN(char)) {
                const squareId = `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`;
                const square = board.querySelector(`#${squareId}`);
                square.innerHTML = getPieceImage(char); 
                colIndex++;
            } else {
                colIndex += parseInt(char); 
            }
        }
    });
  } 
  
    function getPieceImage(piece) {
        const pieceName = {
          'p': 'pawn_black', 'r': 'rook_black', 'n': 'knight_black',
          'b': 'bishop_black', 'q': 'queen_black', 'k': 'king_black',
          'P': 'pawn_white', 'R': 'rook_white', 'N': 'knight_white',
          'B': 'bishop_white', 'Q': 'queen_white', 'K': 'king_white'
        };
        return `<img src="images/${pieceName[piece]}.png" alt="${pieceName[piece]}">`;
      }

  });