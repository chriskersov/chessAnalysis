document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('main');
    const board = document.getElementById('board');
    const overlay = document.getElementById('overlay');
    const pgnTextarea = document.getElementById('PGN');
    let dragCounter = 0;

    let username = 'chriskersov'

    async function fetchGameArchives(username) {

      const response = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);
  
      if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
      }

      
  
      const data = await response.json();
      let gamesDetails = [];
      let gamesCount = 0; // Add a counter for the games
  
      // Fetch details for each game
    for (const archiveUrl of data.archives.reverse()) { // Reverse the archives array
        const archiveResponse = await fetch(archiveUrl);
        if (!archiveResponse.ok) {
            throw new Error('Network response was not ok ' + archiveResponse.statusText);
        }
        const archiveData = await archiveResponse.json();

        // Get the first game
        const firstGame = archiveData.games[0];
        if (firstGame) {
            const whiteUsername = firstGame.white.username;
            const blackUsername = firstGame.black.username;

            // Check which username matches the input username (ignoring case)
            if (whiteUsername.toLowerCase() === username.toLowerCase()) {
                // Use the white username to set the title
                document.getElementById('player-history-title').innerText = `${whiteUsername}'s game history`;
            } else if (blackUsername.toLowerCase() === username.toLowerCase()) {
                // Use the black username to set the title
                document.getElementById('player-history-title').innerText = `${blackUsername}'s game history`;
            }
          }
  
          // const archiveData = await archiveResponse.json();
  
          // Extract the usernames, ratings, and result
          for (const game of archiveData.games.reverse()) { // Reverse the games array
              // Break the loop if gamesCount is 100
              if (gamesCount === 200) {
                  break;
              }
  
              const whiteUsername = game.white.username;
              const whiteRating = game.white.rating;
              const blackUsername = game.black.username;
              const blackRating = game.black.rating;
              const result = game.pgn.split("\n").find(line => line.startsWith('[Result')).split('"')[1];
              const [result1, result2] = result.split('-');
              const PGNtoLoad = game.pgn;
  
              // Add the game details to the gamesDetails array
              gamesDetails.push(`<div class="game-history-wrapper" game-pgn='${PGNtoLoad}'>`);
              gamesDetails.push(`<div class="game-history-details">${whiteUsername} (${whiteRating})<br>${blackUsername} (${blackRating})<br></div>`);
              gamesDetails.push(`<div class="game-history-result">${result1}<br>${result2}<br></div>`);
              gamesDetails.push(`</div>`);
  
              gamesCount++; // Increment the counter
          }
  
          // Break the outer loop if gamesCount is 100
          if (gamesCount === 200) {
              break;
          }
      }
  
      // Reverse the gamesDetails array and add it to the player-history-games element
      // gamesDetails.reverse();
      document.getElementById('player-history-games').innerHTML = gamesDetails.join('');
  }
  
  fetchGameArchives(username);
    
    document.getElementById('player-history-games').addEventListener('click', async function (event) {
      const wrapper = event.target.closest('.game-history-wrapper');
      if (wrapper) {
          const gamePGN = wrapper.getAttribute('game-pgn');
  
          document.getElementById('PGN').value = gamePGN;
  
          // Programmatically click the 'submit' button
          document.getElementById('submit').click();
      }
    });

    document.getElementById('history-search-submit').addEventListener('click', (event) => {

      searchUsername = document.getElementById('history-search-bar').value;
      fetchGameArchives(searchUsername);

      if (searchUsername.length > 19) {

        document.getElementById('player-history-title').style.fontSize = '1.8vmin'; // Adjust the font size as needed
      }

    });

    const stockfish = new Worker('scripts/stockfish.js');
    stockfish.postMessage('uci');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function isChessBoardDrag(e) {
        return e.target.closest('#board') !== null;
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        document.addEventListener(eventName, (e) => {
            if (isChessBoardDrag(e)) return;
            dragCounter++;
            overlay.style.display = 'flex';
            board.classList.add('blur');
        }, false);
    });

    document.addEventListener('dragleave', (e) => {
        if (isChessBoardDrag(e)) return;
        dragCounter--;
        if (e.relatedTarget === null || dragCounter === 0) {
            overlay.style.display = 'none';
            board.classList.remove('blur');
            dragCounter = 0; 
        }
    }, false);

    document.addEventListener('drop', (e) => {
        if (isChessBoardDrag(e)) return;
        dragCounter = 0;
        overlay.style.display = 'none';
        board.classList.remove('blur');
        handleDrop(e);
    }, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length) {
            const file = files[0];
            const reader = new FileReader();

            reader.onload = function(event) {
                const pgn = event.target.result;
                pgnTextarea.value = pgn;
                pgnTextarea.dispatchEvent(new Event('input')); 
            };

            reader.readAsText(file);
        }
    }

    //---------------------------------------------------------------------------------------------------

    document.getElementById('upload-pgn').addEventListener('click', () => {
        document.getElementById('file-input').click();
      });

    document.getElementById('file-input').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            document.getElementById('PGN').value = e.target.result;
          };
          reader.readAsText(file);
        }
    });

    //---------------------------------------------------------------------------------------------------

    document.getElementById('analysis-title').addEventListener('click', () => {
    
        document.getElementById('white-history').style.display = 'none';
        document.getElementById('black-history').style.display = 'none';

    });

    document.getElementById('move-history-title').addEventListener('click', () => {
    
      document.getElementById('white-history').style.display = 'flex';
      document.getElementById('black-history').style.display = 'flex';

  });


    //---------------------------------------------------------------------------------------------------

    let soundPlayed = false;  // Flag to track if sound has been played for the current move

    const chess = new Chess(); 
    let currentMoveIndex = 0;
    let moves = [];

    const initialFen = chess.fen(); 
    updateBoard(initialFen); 
  
    document.getElementById('submit').addEventListener('click', () => {

        // document.getElementById('move-history-title').innerHTML = 'move history';

        const pgn = document.getElementById('PGN').value; 
        const loaded = chess.load_pgn(pgn); 

        if (!loaded) {
          alert('Invalid PGN');
          return;
        }

        moves = chess.history({ verbose: true });
        currentMoveIndex = moves.length; 
        const fen = chess.fen(); 
        updateBoard(fen); 

        const playerWhite = pgn.match(/\[White\s"(.*)"\]/);
        const playerBlack = pgn.match(/\[Black\s"(.*)"\]/);

        if (playerWhite && playerBlack) {

          function adjustFontSize(name, elementId) {
              const element = document.getElementById(elementId);
              if (name.length > 19) {
                  element.style.fontSize = '1.3vmin'; // Adjust the font size as needed
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
      
          adjustFontSize(playerWhite[1], 'player-white');
          document.getElementById('vs').innerHTML = 'vs';
          adjustFontSize(playerBlack[1], 'player-black');
      }

        showHistory(moves);

        const currentFen = chess.fen();
        evaluatePosition(currentFen);

    });

  function showHistory() {

    moves = chess.history({ verbose: true });

    currentFen = chess.fen();
    chess.reset();

    const readableMoves = [];

    moves.forEach((move) => {
        chess.move({ from: move.from, to: move.to });
        const history = chess.history({ verbose: true });
        const lastMove = history[history.length - 1];
        readableMoves.push(lastMove.san); // Get the algebraic notation
    });

    let countWhite = 0; 
    let countBlack = 0;
    let tempMove = '';
    let whiteList = [];
    let blackList = [];
    
    for (let i = 0; i < readableMoves.length; i++) {

        if (i % 2 === 0) {

            countWhite++;
            tempMove = `${countWhite}. ${readableMoves[i]}<br><br>`;
            whiteList.push(tempMove);

        } else {

          countBlack++;
          tempMove = `${countBlack}. ${readableMoves[i]}<br><br>`;
          blackList.push(tempMove);

        }

    }

    document.getElementById('white-history').innerHTML = '';
    document.getElementById('black-history').innerHTML = '';


    for (let i = 0; i < whiteList.length; i++) {

        document.getElementById('white-history').innerHTML += whiteList[i];

    }

    for (let i = 0; i < blackList.length; i++) {

      document.getElementById('black-history').innerHTML += blackList[i];

  }

    chess.load(currentFen);

  }

  function evaluatePosition(fen) {
      stockfish.postMessage(`position fen ${fen}`);
      stockfish.postMessage(`go depth 18`);
  }

  stockfish.onmessage = function(event) {
      const message = event.data;
      // console.log(message);

      if (message.includes('info depth')) {
        const matchCp = message.match(/score cp (-?\d+)/);
        const matchMate = message.match(/score mate (-?\d+)/);

        if (matchCp) {
            const evaluation = parseInt(matchCp[1], 10);
            if (currentMoveIndex % 2 === 0) {
              updateEvalBar((evaluation / 100).toFixed(1)); 
            } else {
              updateEvalBar((-evaluation / 100).toFixed(1)); 
            }
        } else if (matchMate) {

          if (currentMoveIndex % 2 === 0) {

            const mateIn = parseInt(matchMate[1], 10);
            updateEvalBar(`M${mateIn}`); 

          } else {

            const mateIn = parseInt(matchMate[1], 10);
            updateEvalBar(`M${-mateIn}`); 

          }
        } else {
            console.log("no valid score found");
        }
      }  

      if (message.includes('bestmove')) {

          const match = message.match(/bestmove\s(\w+)/);
          if (match) {
              const bestMove = match[1];
              // console.log(`best move: ${bestMove}`);
          }
      }
  };

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
  
          currentMoveIndex--;
          chess.reset();
          for (let i = 0; i < currentMoveIndex; i++) {
              nextMove = moves[i];
              chess.move(nextMove);
          }
          const fen = chess.fen();
          updateBoard(fen);
  
          // Ensure the correct move is analyzed
          const sanMove = moves[currentMoveIndex] ? moves[currentMoveIndex].san : null;
          if (sanMove) {
              getNextMoveAndAnalyze(fen, pgn, sanMove);
          }
  
          evaluatePosition(fen); 
      } else {
          startPosition();
      }
  }
  
  function nextPosition() {
      if (currentMoveIndex < moves.length) {
          const pgn = document.getElementById('PGN').value; 
  
          nextMove = moves[currentMoveIndex];
          chess.move(nextMove);
          currentMoveIndex++;
          const fen = chess.fen(); 
          updateBoard(fen); 
  
          // Ensure the correct move is analyzed
          const sanMove = moves[currentMoveIndex] ? moves[currentMoveIndex].san : null;
          if (sanMove) {
              getNextMoveAndAnalyze(fen, pgn, sanMove);
          }
  
          evaluatePosition(fen); 
      } else {
          endPosition();
      }
  }
  
  function playSound(type) {
      const sounds = {
          normal: 'sounds/move-self.mp3',
          capture: 'sounds/capture.mp3',
          check: 'sounds/move-check.mp3',
          checkmate: 'sounds/game-end.mp3',
          draw: 'sounds/game-draw.mp3'
      };
  
      if (sounds[type]) {
          const audio = new Audio(sounds[type]);
          audio.play();
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
  
      if (chess.in_checkmate()) {
          moveType = 'checkmate';
      } else if (chess.in_stalemate() || chess.in_draw() || chess.insufficient_material() || chess.in_threefold_repetition()) {
          moveType = 'draw';
      } else if (move.captured) {  // Check if the move results in a capture
          moveType = 'capture';
      } else if (chess.in_check()) {
          moveType = 'check';
      }
  
      playSound(moveType);
  
      return {
          moveType: moveType,
          fen: chess.fen()
      };
  }
  
  // Function to get the previous FEN by reverting one move
  function getPreviousFen(fen, pgn) {
      chess.load(fen);
      chess.load_pgn(pgn);
      chess.undo();
      return chess.fen();
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