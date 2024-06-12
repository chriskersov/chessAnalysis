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

        const currentFen = chess.fen();
        evaluatePosition(currentFen);

    });

  function evaluatePosition(fen) {
      stockfish.postMessage(`position fen ${fen}`);
      stockfish.postMessage(`go depth 20`);
  }

  stockfish.onmessage = function(event) {
      const message = event.data;


      if (message.includes('info depth 20')) {
        const matchCp = message.match(/score cp (-?\d+)/);
        const matchMate = message.match(/score mate (-?\d+)/);

        if (matchCp) {
            const evaluation = parseInt(matchCp[1], 10);
            if (currentMoveIndex % 2 === 0) {
              console.log(`evaluation: ${currentMoveIndex}`, evaluation / 100); // output the evaluation score in centipawns / 100
            } else {
              console.log(`evaluation: ${currentMoveIndex}`, -evaluation / 100);
            }
            // updateEvalBar(evaluation); 
        } else if (matchMate) {
            const mateIn = parseInt(matchMate[1], 10);
            console.log(`mate in ${mateIn} moves`); 
            // updateEvalBar(`Mate in ${mateIn} moves`); 
        } else {
            console.log("no valid score found");
        }
    }

      // console.log(message); // log all messages for debugging
  };

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