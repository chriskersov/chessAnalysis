document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('main');
    const board = document.getElementById('board');
    const overlay = document.getElementById('overlay');
    const pgnTextarea = document.getElementById('PGN');
    let dragCounter = 0;

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

    const chess = new Chess(); 
    let currentMoveIndex = 0;
    let moves = [];

    const initialFen = chess.fen(); 
    updateBoard(initialFen); 
  
    document.getElementById('submit').addEventListener('click', () => {
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

          function splitName(name) {
            if (name.length > 16) {
                const midpoint = Math.ceil(name.length / 2); // Find the midpoint of the string
                return name.slice(0, midpoint) + '<br>' + name.slice(midpoint); // Insert a line break at the midpoint
            }
            return name;
        }
        
        document.getElementById('player-white').innerHTML = splitName(playerWhite[1]);
        document.getElementById('vs').innerHTML = 'vs';
        document.getElementById('player-black').innerHTML = splitName(playerBlack[1]);

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

    let count = 0;  
    let tempMove = '';
    let whiteList = [];
    let blackList = [];
    
    for (let i = 0; i < readableMoves.length; i++) {

        if (i % 2 === 0) {

            count++;
            tempMove = `${count}. ${readableMoves[i]}<br>`;
            whiteList.push(tempMove);

        } else {

          count++;
          tempMove = `${count}. ${readableMoves[i]}<br>`;
          blackList.push(tempMove);

        }

    }

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
      stockfish.postMessage(`go depth 22`);
  }

  stockfish.onmessage = function(event) {
      const message = event.data;
      console.log(message);

      if (message.includes('info depth')) {
        const matchCp = message.match(/score cp (-?\d+)/);
        const matchMate = message.match(/score mate (-?\d+)/);

        if (matchCp) {
            const evaluation = parseInt(matchCp[1], 10);
            if (currentMoveIndex % 2 === 0) {
              // console.log(`evaluation: ${currentMoveIndex}`, evaluation / 100); // output the evaluation score in centipawns / 100
              updateEvalBar((evaluation / 100).toFixed(1)); 
            } else {
              // console.log(`evaluation: ${currentMoveIndex}`, -evaluation / 100);
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
              console.log(`best move: ${bestMove}`);
          }
      }

      // console.log(message); // log all messages for debugging
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

      if (evaluation > 0 && evaluation <= 1) {

        percentage = (evaluation * 12.5) + 50;
        document.getElementById('moving-eval').style.height = `${percentage}%`;

      } else if (evaluation < 0 && evaluation >= -1) {

        percentage = 50 - (-evaluation * 12.5);
        console.log(percentage);
        document.getElementById('moving-eval').style.height = `${percentage}%`;

      } else if (evaluation > 1 && evaluation <= 4) {

        percentage = (((evaluation - 1) / 3) * 32.5) + 62.5;
        document.getElementById('moving-eval').style.height = `${percentage}%`;

      } else if (evaluation < -1 && evaluation >= -4) {

        percentage = 37.5 - (((-evaluation - 1) / 3) * 32.5);
        document.getElementById('moving-eval').style.height = `${percentage}%`;

      } else if (evaluation > 4) {

        document.getElementById('moving-eval').style.height = `95%`;

      } else if (evaluation < -4) {

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
            currentMoveIndex--;
            chess.reset();
            for (let i = 0; i < currentMoveIndex; i++) {
              chess.move(moves[i]);
            }
            const fen = chess.fen();
            updateBoard(fen);
            evaluatePosition(fen); 
          } else {
            startPosition();
          }

    }

    function nextPosition() {

        if (currentMoveIndex < moves.length) {
            chess.move(moves[currentMoveIndex]);
            currentMoveIndex++;
            const fen = chess.fen(); 
            updateBoard(fen); 
            evaluatePosition(fen); 
          } else {
            endPosition();
          }
          
    }
  
    function updateBoard(fen) {
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