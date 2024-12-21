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

    if (message.includes('bestmove')) { // this is for later

        const match = message.match(/bestmove\s(\w+)/);

        if (match) {

            const bestMove = match[1];

            return bestMove;
          
        }

    }

  };

  // ----------------------------------------------------------------------------------------------------------------------------

  // function getBestMove() {

  //   bestMove = stockfish.postMessage('go depth 18'); // post the go command to the stockfish worker

  // }

  function accuracy() { 

    evaluatePosition(moves[0])
    console.log(getBestMove);

  }

  // ----------------------------------------------------------------------------------------------------------------------------

  function updateEvalBar(evaluation) {

    document.getElementById('moving-eval').style.backgroundColor = 'white'; // set moving part of bar to white
    document.getElementById('eval-value').style.color = 'black'; // set back of eval bar to black
    const evalValue = document.getElementById('eval-value'); // get the eval
    let percentage = 0;
    document.getElementById('moving-eval').style.borderTopLeftRadius = '0'; 
    document.getElementById('moving-eval').style.borderTopRightRadius = '0';

    if (currentMoveIndex === 0) { // if its the first move

      evalValue.innerHTML = '0.0'; // eval is 0.0
      document.getElementById('moving-eval').style.height = '50%'; // eval is even

    } else if (evaluation.includes('M')) { // if there is a mate

      const mateIn = parseInt(evaluation.slice(1), 10); // get the number of moves to mate

      if (mateIn > 0) { // if the number of moves to mate is greater than 0 then its mate for white

        document.getElementById('moving-eval').style.height = '100%';
        document.getElementById('moving-eval').style.borderTopLeftRadius = '0.7vmin';
        document.getElementById('moving-eval').style.borderTopRightRadius = '0.7vmin';

        evalValue.innerHTML = evaluation;
      
      } else if (mateIn < 0) { // if the number of moves to mate is less than 0 then its mate for black

        document.getElementById('moving-eval').style.backgroundColor = 'rgb(54, 54, 54)'; 
        document.getElementById('eval-value').style.color = 'white';
        evalValue.innerHTML = (`M${-mateIn}`);

      } else if (mateIn === 0) { // if the number of moves to mate is 0

        result = pgnTextarea.value.split('Result "')[1].split('"')[0];

        if (result === '1-0') { // if white won

          evalValue.innerHTML = 'W';
          document.getElementById('moving-eval').style.height = '100%';
          document.getElementById('moving-eval').style.borderTopLeftRadius = '0.7vmin';
          document.getElementById('moving-eval').style.borderTopRightRadius = '0.7vmin';

        } else if (result === '0-1') { // if black won

          evalValue.innerHTML = 'B';
          document.getElementById('moving-eval').style.backgroundColor = 'rgb(54, 54, 54)'; 
          document.getElementById('eval-value').style.color = 'white';

        }

      } 

    } else { // if the eval is in a certain range then move the bar in a certain way

      if (Math.abs(evaluation) < 0.00001) { // if the evaluation is less than 0.00001 so basically 0 then its even

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

  // ----------------------------------------------------------------------------------------------------------------------------

  document.getElementById('start-button').addEventListener('click', startPosition);
  document.getElementById('end-button').addEventListener('click', endPosition);
  document.getElementById('next-button').addEventListener('click', nextPosition); 
  document.getElementById('previous-button').addEventListener('click', previousPosition); 

  document.addEventListener('keydown', (event) => { // when a key is pressed

      if (event.key === 'ArrowLeft') { // if the key is the left arrow key

          previousPosition(); // call previous position function

      } if (event.key === 'ArrowRight') { // if the key is the right arrow key

          nextPosition(); // call next position function

      }

  });

  // ----------------------------------------------------------------------------------------------------------------------------

  function startPosition() {

      currentMoveIndex = 0; // reset the current move index
      chess.reset(); // reset the board
      const initialFen = chess.fen(); // get the fen of the board
      updateBoard(initialFen); // update the board with the fen
      evaluatePosition(initialFen); // evaluate the position

  }

  // ----------------------------------------------------------------------------------------------------------------------------

  function endPosition() {

      const pgn = document.getElementById('PGN').value;  // get the pgn from the textarea
      chess.load_pgn(pgn); // load the pgn
      const finalFen = chess.fen(); // get the fen of the final position
      updateBoard(finalFen); // update the board with the final position
      currentMoveIndex = moves.length; // set the current move index to the length of the moves array
      evaluatePosition(finalFen); // evaluate the final position

  }

  // ----------------------------------------------------------------------------------------------------------------------------

  function previousPosition() {

    if (currentMoveIndex > 0) { // if the current move index is greater than 0

        const pgn = document.getElementById('PGN').value; // get the pgn from the textarea
        currentMoveIndex--; // decrement the current move index
        chess.reset(); // reset the board

        for (let i = 0; i < currentMoveIndex; i++) { // for each move in the moves array

            const nextMove = moves[i]; // get the next move
            chess.move(nextMove); // move the piece

        } // reset the board and play all moves up to the current move

        const fen = chess.fen(); // get the fen of the current position
        updateBoard(fen); // update the board with the fen
        nextSound(); // play the next sound
        chess.load(fen); // load the fen
        evaluatePosition(fen); // evaluate the position

    } else {

        startPosition(); // go back to the start position

    }

  } 

  // ----------------------------------------------------------------------------------------------------------------------------
  
  function nextPosition() {

    if (currentMoveIndex < moves.length) { // if the current move index is less than the length of the moves array

        const pgn = document.getElementById('PGN').value; // get the pgn from the textarea
        const currentFen = chess.fen();  // get the current fen
        let currentSanMove;
        
        if (moves[currentMoveIndex]) { // if the current move index exists

          currentSanMove = moves[currentMoveIndex].san; // get the current move as a san move

        } else { // if the current move index does not exist

          currentSanMove = null; // set the current san move to null

        }

        nextMove = moves[currentMoveIndex]; // get the next move
        chess.move(nextMove); // move the piece
        currentMoveIndex++; // increment the current move index
        const fen = chess.fen(); // get the fen of the current position
        updateBoard(fen); //  update the board with the fen

        if (currentSanMove) { // if the current san move exists

            analyzeAndPlaySound(currentFen, currentSanMove);  // this is for the sound

        }

        evaluatePosition(fen); // evaluate the position

    } else { // if the current move index is greater than the length of the moves array

        endPosition(); // go to the end position

    }

  }

  // ----------------------------------------------------------------------------------------------------------------------------

  function nextSound() { // this ended being the fix for everything sound related

    const pgn = document.getElementById('PGN').value; // get the pgn from the textarea
    const currentFen = chess.fen(); // get the current fen
    let currentSanMove;
        
    if (moves[currentMoveIndex]) { // if the current move index exists

      currentSanMove = moves[currentMoveIndex].san; // get the current move as a san move

    } else { // if the current move index does not exist

      currentSanMove = null; // set the current san move to null

    }

    nextMove = moves[currentMoveIndex]; // get the next move
    chess.move(nextMove); // move the piece
    currentMoveIndex++; //  increment the current move index
    const fen = chess.fen(); // get the fen of the current position

    if (currentSanMove) { // if the current san move exists

        analyzeAndPlaySound(currentFen, currentSanMove);  // this is for sound

    }

    if (currentMoveIndex > 0) { // if the current move index is greater than 0

      const pgn = document.getElementById('PGN').value; // get the pgn from the textarea
      currentMoveIndex--; // decrement the current move index
      chess.reset(); // reset the board

      for (let i = 0; i < currentMoveIndex; i++) { // for each move in the moves array

          const nextMove = moves[i]; // get the next move
          chess.move(nextMove); // move the piece

      } // reset the board and play all moves up to the current move

      const fen = chess.fen(); // get the fen of the current position
      chess.load(fen); // load the fen

      } else { // if the current move index is less than or equal to 0

        startPosition(); // go back to the start position

      }

  }

  // ----------------------------------------------------------------------------------------------------------------------------

  const sounds = { // object containing all the sounds

    normal: new Audio('sounds/move-self.mp3'),
    capture: new Audio('sounds/capture.mp3'),
    check: new Audio('sounds/move-check.mp3'),
    checkmate: new Audio('sounds/game-end.mp3'),
    draw: new Audio('sounds/game-draw.mp3')

  };

  Object.values(sounds).forEach(sound => sound.load()); // load all the sounds

  // ----------------------------------------------------------------------------------------------------------------------------

  function playSound(type) {

      if (sounds[type]) { // if the sound exists

          sounds[type].play(); // play the sound

      }

  }

  // ----------------------------------------------------------------------------------------------------------------------------
  
  function analyzeAndPlaySound(previousFen, sanMove) {

    const validFen = chess.load(previousFen);  //  load the previous fen

    if (!validFen) { // if the fen is not valid

        console.log('Invalid FEN'); 
        return { error: 'Invalid FEN' }; // return an error

    }

    const move = chess.move(sanMove); // move the piece

    if (!move) { // if the move is not valid

        console.log('Invalid move:', sanMove);
        return { error: 'Invalid move' }; // return an error

    }

    let moveType = 'normal'; // set the move type to normal

    if (move.captured) { // if the move results in a capture

        moveType = 'capture'; // set the move type to capture

    } else if (chess.in_check()) { // if the move results in a check

        moveType = 'check'; // set the move type to check

    }

    playSound(moveType); // play the appropriate sound

    return {

        moveType: moveType, // return the move type        
        fen: chess.fen() // return the fen 

    };

  } 

  // ----------------------------------------------------------------------------------------------------------------------------


  // ----------------------------------------------------------------------------------------------------------------------------

  function updateBoard(fen) {

    const positions = fen.split(' ')[0];  // get the positions from the fen
    const rows = positions.split('/'); // split the positions into rows
    const board = document.getElementById('board'); // get the board

    document.querySelectorAll('.squares').forEach(square => { // for each square

        square.innerHTML = ''; // clear the square

    });

    rows.forEach((row, rowIndex) => { // for each row

        let colIndex = 0; // initialise the column index

        for (let char of row) { // for each character in the row

            if (isNaN(char)) { // if the character is not a number

                const squareId = `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`; // get the square id
                const square = board.querySelector(`#${squareId}`); // get the square
                square.innerHTML = getPieceImage(char); // set the square to the piece image
                colIndex++; // e

            } else { // if the character is a number

                colIndex += parseInt(char);  // increment the column index by the number

            }

        }

    });

  } 

  // ----------------------------------------------------------------------------------------------------------------------------
  
    function getPieceImage(piece) {

        const pieceName = { // object containing the piece names

          'p': 'pawn_black', 'r': 'rook_black', 'n': 'knight_black',
          'b': 'bishop_black', 'q': 'queen_black', 'k': 'king_black',
          'P': 'pawn_white', 'R': 'rook_white', 'N': 'knight_white',
          'B': 'bishop_white', 'Q': 'queen_white', 'K': 'king_white'
        };

        return `<img src="images/${pieceName[piece]}.png" alt="${pieceName[piece]}">`; // return the image of the piece

      }

  });

  // ----------------------------------------------------------------------------------------------------------------------------