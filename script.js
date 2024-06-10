document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('main');
    const board = document.getElementById('board');
    const overlay = document.getElementById('overlay');
    const pgnTextarea = document.getElementById('PGN');
    let dragCounter = 0;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Check if the drag event is from a chess piece or the board
    function isChessBoardDrag(e) {
        return e.target.closest('#board') !== null;
    }

    // Handle dragenter and dragover to show overlay and blur main
    ['dragenter', 'dragover'].forEach(eventName => {
        document.addEventListener(eventName, (e) => {
            if (isChessBoardDrag(e)) return;
            dragCounter++;
            overlay.style.display = 'flex';
            board.classList.add('blur');
        }, false);
    });

    // Handle dragleave to hide overlay and remove blur when leaving the window
    document.addEventListener('dragleave', (e) => {
        if (isChessBoardDrag(e)) return;
        dragCounter--;
        if (e.relatedTarget === null || dragCounter === 0) {
            overlay.style.display = 'none';
            board.classList.remove('blur');
            dragCounter = 0; // Reset counter to prevent multiple dragleave issues
        }
    }, false);

    // Handle drop to hide overlay, remove blur, and process the file
    document.addEventListener('drop', (e) => {
        if (isChessBoardDrag(e)) return;
        dragCounter = 0;
        overlay.style.display = 'none';
        board.classList.remove('blur');
        handleDrop(e);
    }, false);

    // Handle dropped files
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length) {
            const file = files[0];
            const reader = new FileReader();

            reader.onload = function(event) {
                const pgn = event.target.result;
                pgnTextarea.value = pgn;
                pgnTextarea.dispatchEvent(new Event('input')); // Adjust the textarea height
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

    const chess = new Chess(); // Initialize a new Chess game

    let currentMoveIndex = 0;
    let moves = [];

    const initialFen = chess.fen(); 
    updateBoard(initialFen); // Update the board with the initial position
  
    document.getElementById('submit').addEventListener('click', () => {
        const pgn = document.getElementById('PGN').value; // Get PGN input
        const loaded = chess.load_pgn(pgn); // Load PGN into chess.js

        if (!loaded) {
          alert('Invalid PGN');
          return;
        }

        moves = chess.history({ verbose: true });
        currentMoveIndex = moves.length; // Set the index to the end of the game
        const fen = chess.fen(); // Get the FEN representation of the current position
        updateBoard(fen); // Update the board with the new position
    });

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

        currentMoveIndex = 0; // Reset the move index to 0
        chess.reset(); // Reset the chess game
        const initialFen = chess.fen(); // Get the FEN for the initial position
        updateBoard(initialFen); // Update the board with the initial position

    }

    function endPosition() {

        const pgn = document.getElementById('PGN').value; // Get PGN input
        chess.load_pgn(pgn); 
        const finalFen = chess.fen(); // Get the FEN representation of the current position
        updateBoard(finalFen); // Update the board with the new position
        currentMoveIndex = moves.length; // Set the index to the end of the game

    }

    function previousPosition() {

        if (currentMoveIndex > 0) {
            currentMoveIndex--;
            chess.reset();
            for (let i = 0; i < currentMoveIndex; i++) {
              chess.move(moves[i]);
            }
            const fen = chess.fen(); // Get the FEN after undoing the move
            // document.getElementById('PGN').value = chess.pgn(); // Update the PGN in the textarea
            updateBoard(fen); // Update the board with the new position
          } else {
            startPosition();
          }

    }

    function nextPosition() {

        if (currentMoveIndex < moves.length) {
            chess.move(moves[currentMoveIndex]);
            currentMoveIndex++;
            const fen = chess.fen(); // Get the FEN after making the move
            // document.getElementById('pgn').value = chess.pgn(); // Update the PGN in the textarea
            updateBoard(fen); // Update the board with the new position
          } else {
            endPosition();
          }
          
    }
  
    function updateBoard(fen) {
      const positions = fen.split(' ')[0]; // Extract board position from FEN
      const rows = positions.split('/'); // Split into rows
      const board = document.getElementById('board');
  
      // Clear existing pieces
      document.querySelectorAll('.squares').forEach(square => {
        square.innerHTML = '';
      });
  
      rows.forEach((row, rowIndex) => {
        let colIndex = 0;
        for (let char of row) {
          if (isNaN(char)) {
            const squareId = `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`;
            const square = board.querySelector(`#${squareId}`);
            square.innerHTML = getPieceImage(char); // Set piece image
            colIndex++;
          } else {
            colIndex += parseInt(char); // Skip empty squares
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