/**
 * @author Nathaniel Waldschmidt
 */
class CheckboxSnake {
    /**
     * @param {HTMLDivElement} gameboardContainer 
     * @param {Number} gridSize 
     */
    constructor(gameboardContainer, gridSize) {
        // Styles the gameboard properly.
        gameboardContainer.style = `display: grid; grid-template-columns: repeat(${gridSize}, 20px); justify-content: center;`;

        // Minimum grid size is 10.
        if (gridSize < 10) gridSize = 10;
        this.gridSize = gridSize;

        // Builds the directions object to make it easier to move the snake.
        this.directions = {
            right:  1,
            left:  -1,
            up:    -this.gridSize,
            down:   this.gridSize
        }
        document.addEventListener('keydown', (e) => this.directionAdjustment(e));

        // Fills the gameboard container with checkboxes.
        let gameboardHTML = '';
        for (let i = 0; i < (gridSize * gridSize); i++) {
            gameboardHTML = `${gameboardHTML} <input class="gamepiece" type="checkbox" data-grid-pos="${i}" />`
        }
        gameboardContainer.innerHTML = gameboardHTML;

        // Game Variables.
        this.gamepieces        = document.querySelectorAll('.gamepiece');
        this.snakePositions    = [1, 0];                   // The index of each piece of the snake.  Head is always index 0.
        this.foodPositions     = [];                       // The index of each active piece of food.
        this.activeDirection   = this.directions.right; // The direction the snake will initally be moving.
        this.speed             = 60;                   // How often the snake moves in milliseconds.
        this.gameRunning       = false;                 // Boolean of whether the game is running or not.
        this.oldTimestamp;                              // The timestamp from the last tick.
    }

    /**
     * Used for keyboard event listeners to 
     * adjust the direction of the snake.
     * 
     * @param {KeyboardEvent} e 
     */
    directionAdjustment(e) {
        switch (e.key) {
            case 'd':
            case 'ArrowRight':
                if (this.activeDirection != this.directions.left) {
                    this.activeDirection = this.directions.right;
                }
                break;

            case 'a':
            case 'ArrowLeft':
                if (this.activeDirection != this.directions.right) {
                    this.activeDirection = this.directions.left;
                }
                break;
                
            case 'w':
            case 'ArrowUp':
                if (this.activeDirection != this.directions.down) {
                    this.activeDirection = this.directions.up;
                }
                break;

            case 's':
            case 'ArrowDown':
                if (this.activeDirection != this.directions.up) {
                    this.activeDirection = this.directions.down;
                }
                break;

            // Pauses the game.
            case 'p':
            case 'Escape':
                // Determines if the game needs to resume or pause.
                if (!this.gameRunning) {
                    this.startGame();
                } else {
                    this.gameRunning = false;
                }
                break;
        }
    }

    /**
     * This begins/ resumes a game.
     */
    startGame() {
        // If this is starting a new game then there would be no food on the board.
        if (this.foodPositions.length == 0) {
            let difficulty = document.getElementById('game-difficulty').value;

            // The min and max for difficulty.
            if (difficulty <= 0) difficulty = 1;
            if (difficulty > 5)  difficulty = 5;

            // Generates the food positions.
            for (let i = 0; i < difficulty; i++) {
                // Creates new food positions.
                this.foodPositions[i] = this.newFoodPosition();
            }
        }

        // Begins the game loop.
        this.gameRunning = true;
        window.requestAnimationFrame(gameloop);
    }

    endGame() {
        this.activeDirection = this.directions.right;
        this.snakePositions  = [1,0];
        this.foodPositions   = [];
        this.gamepieces.forEach((cb) => cb.checked = true);
    }

    /**
     * This will generate new food positions and 
     * will also ensure that the new positions 
     * are not on top of the snake.
     * 
     * @returns {Number} Returns back the food position.
     */
    newFoodPosition() {
        // Creates a new food position.
        let newFoodPosition = Math.floor(Math.random() * this.gridSize * this.gridSize);

        // Ensures the new food is not where the snake already exists.
        while(this.snakePositions.includes(newFoodPosition)) {
            newFoodPosition = Math.floor(Math.random() * this.gridSize * this.gridSize);
        }

        // Renders the food onto the screen.
        this.gamepieces[newFoodPosition].checked = true;

        // Stores the position for rendering.
        return newFoodPosition;
    }

    /**
     * This moves all of the snake links on the board.
     */
    moveSnake() {
        // Checks if a piece of food was eaten.
        let addSnakeLink = this.checkFoodCollision();

        // Gets the body of the snake to follow.
        for (let i = this.snakePositions.length-1; i > 0; i--) {
            // It unchecks the last link to create the motion UNLESS there was food eaten.
            if (i == this.snakePositions.length-1 && !addSnakeLink) {
                this.gamepieces[this.snakePositions[i]].checked = false;
            }

            // Adds another link to the snake when it eats food.
            if (addSnakeLink) {
                this.snakePositions[i+1] = this.snakePositions[i];

                // Updates the scoreboard.
                document.getElementById('scoreboard').innerText = `Score: ${this.snakePositions.length-1}`;
            }

            // Sets the piece equals to the piece in front. Creates the slither movement.
            this.snakePositions[i] = this.snakePositions[i-1];

            // Checks the box for this link of the snake.
            this.gamepieces[this.snakePositions[i]].checked = true;
        }

        // Moves the head of the snake.
        this.snakePositions[0] += this.activeDirection;

        // Checks if the snake is going off of the gameboard.
        this.checkOverflow();

        this.gamepieces[this.snakePositions[0]].checked = true;
    }

    /**
     * Detects a collision with another link of 
     * the snake.
     */
    checkSnakeCollision() {
        // No collision check necessary for this short of a snake.
        if (this.snakePositions.length <= 4) return; 

        // Checks the entire snakePositions array except for the first index (the head).
        if (this.snakePositions.includes(this.snakePositions[0], 1)) {
            this.gameRunning = false; // Stops the game loop.
            this.endGame();
        }
    }

    /**
     * Detects a collision with a piece of food
     * which would trigger to add another link 
     * onto the snake and increase the score in
     * the game.
     * 
     * @returns {Boolean} Whether a collision occurred or not.
     */
    checkFoodCollision() {
        if (this.foodPositions.includes(this.snakePositions[0])) {
            // Finds which piece of food needs a new position.
            const foodIndex = this.foodPositions.findIndex((foodPos) => foodPos == this.snakePositions[0]);

            // Sets the new food position.
            cbSnakeGame.foodPositions[foodIndex] = this.newFoodPosition();
            return true;
        }
        return false;
    }

    /**
     * Checks if the snake on the board is going
     * over the edge of the gameboard.
     */
    checkOverflow() {
        // Detects overflow on the top side of the board.
        if (cbSnakeGame.activeDirection == cbSnakeGame.directions.up) {
            if (cbSnakeGame.snakePositions[0] < 0) {
                // Adds the height of the gameboard.
                cbSnakeGame.snakePositions[0] += (this.gridSize * this.gridSize);
            }

        // Detects overflow on the bottom side of the board.
        } else if (cbSnakeGame.activeDirection == cbSnakeGame.directions.down) {
            if (cbSnakeGame.snakePositions[0] >= (this.gridSize * this.gridSize)) {
                // Subtracts the height of the gameboard.
                cbSnakeGame.snakePositions[0] -= (this.gridSize * this.gridSize);
            }

        // Detects overflow on the right side of the board.
        } else if (cbSnakeGame.activeDirection == cbSnakeGame.directions.right) {
            if (cbSnakeGame.snakePositions[0] % 30 == 0) {
                // Subtracts the width of the gameboard.
                cbSnakeGame.snakePositions[0] -= 30;
            }

        // Detects overflow on the left side of the board.
        } else if (cbSnakeGame.activeDirection == cbSnakeGame.directions.left) {
            if (cbSnakeGame.snakePositions[0] % 30 == 29 || cbSnakeGame.snakePositions[0] == -1) {
                // Adds the width of the gameboard.
                cbSnakeGame.snakePositions[0] += 30;
            }
        }
    }
}
// Creates the snake game object.
const cbSnakeGame = new CheckboxSnake(document.getElementById('gameboard'), 30);

// Event listener for the start button.
document.getElementById('btn-start').addEventListener('click', () => cbSnakeGame.startGame());

// Event listener for the pause/resume button.
document.getElementById('btn-pause').addEventListener('click', () => cbSnakeGame.gameRunning = false);


// All of the inputs on the gameboard.

let oldTimestamp;

// Registers each tick of the game.
function gameloop(timestamp) {
    if (oldTimestamp == undefined) oldTimestamp = timestamp;

    // Renders at the speed of the snake.
    if (timestamp - oldTimestamp >= cbSnakeGame.speed) {
        // Process the movement of the snake.
        cbSnakeGame.moveSnake();

        // Detects collisions with other snake links.
        cbSnakeGame.checkSnakeCollision();
        
        // Updates the last tick timestamp.
        oldTimestamp = timestamp;
    }

    // If the game is running continue looping.
    if (cbSnakeGame.gameRunning) window.requestAnimationFrame(gameloop);
}