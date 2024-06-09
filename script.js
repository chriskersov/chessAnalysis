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

    // Handle dragenter and dragover to show overlay and blur main
    ['dragenter', 'dragover'].forEach(eventName => {
        document.addEventListener(eventName, (e) => {
            dragCounter++;
            overlay.style.display = 'flex';
            board.classList.add('blur');
        }, false);
    });

    // Handle dragleave to hide overlay and remove blur when leaving the window
    document.addEventListener('dragleave', (e) => {
        dragCounter--;
        if (e.relatedTarget === null || dragCounter === 0) {
            overlay.style.display = 'none';
            board.classList.remove('blur');
            dragCounter = 0; // Reset counter to prevent multiple dragleave issues
        }
    }, false);

    // Handle drop to hide overlay, remove blur, and process the file
    document.addEventListener('drop', (e) => {
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

    const chess = new Chess(); // Initialize a new Chess game
  
    document.getElementById('submit').addEventListener('click', () => {
      const pgn = document.getElementById('PGN').value; // Get PGN input
      const loaded = chess.load_pgn(pgn); // Load PGN into chess.js
  
      if (!loaded) {
        alert('Invalid PGN');
        return;
      }
  
      const fen = chess.fen(); // Get the FEN representation of the current position
      updateBoard(fen); // Update the board with the new position
    });
  
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