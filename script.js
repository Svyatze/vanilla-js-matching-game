class MatchGrid {
    constructor(args) {
        this.theme = args.theme;
        this.cardsField = document.querySelector("#board");
        this.countCards = args.rows * args.columns;
        this.timerElement = document.querySelector("#timer");
        this.timeLimit = args.timeLimit;
        this.timer = null;
        this.isMouseOutsidePage = false;
        this.remainingTime = this.timeLimit;
        this.timerStarted = false;
        this.cardsBase = this.generateCardsBase(this.countCards);
        this.shuffledCards = this.shuffleCards(this.cardsBase);
        this.selectedCards = [];
        this.pause = false;
        this.deletedCards = 0;
        this.moves = 0;
        this.restartBtn = document.querySelector("#reset-btn");
        this.dialog = document.querySelector(".dialog");
        this.initWindowEventListeners();
        this.timerIntervalId = null;
        this.handleRestartButtonClick = this.handleRestartButtonClick.bind(this);
        this.addRestartButtonListener();
    }

    static activeTimer = null;

    initGame() {
        const boardElement = document.querySelector("#board");
        boardElement.style.width = `${args.width}px`;
        boardElement.style.minHeight = `${args.height}px`;
        boardElement.style.background = this.theme.BoardColor;

        document.body.style.background = this.theme.FieldColor;
        document.body.style.cssText += this.theme.Font;

        this.createCards();
        this.cardsField.addEventListener("click", this.handleCardClick.bind(this));
        this.cardsField.addEventListener("mouseenter", this.handleMouseEnter.bind(this));
        this.cardsField.addEventListener("mouseleave", this.handleMouseLeave.bind(this));
    }

    initWindowEventListeners() {
        window.addEventListener("blur", this.handleWindowBlur.bind(this));
        window.addEventListener("focus", this.handleWindowFocus.bind(this));
    }

    startGame() {
        this.initGame();
        this.animateTimeBlink();
    }

    handleWindowBlur() {
        if (!this.isGameWon() && !this.pause) {
            this.isMouseOutsidePage = true;
            this.pauseTimer();
            this.updatePauseStatusDisplay();
        }
    }

    handleWindowFocus() {
        if (!this.isGameWon() && this.isMouseOutsidePage) {
            this.isMouseOutsidePage = false;
            this.resumeTimer();
            this.updatePauseStatusDisplay();
        }
    }

    animateTimeBlink() {
        anime.remove('.time-numbers');
        if (this.timerStarted || this.pause) {
            anime({
                targets: '#time',
                opacity: [0, 1],
                duration: 700,
                direction: 'alternate',
                loop: true,
            });
        }
    }


    handleMouseEnter() {
        if (!this.isGameWon() && this.pause) {
            this.isMouseOutsidePage = false;
            this.resumeTimer();
            this.updatePauseStatusDisplay();
        }
    }

    handleMouseLeave() {
        if (!this.isGameWon() && !this.pause) {
            this.isMouseOutsidePage = true;
            this.pauseTimer();
            this.updatePauseStatusDisplay();
        }
    }

    handleCardClick(event) {
        if (!this.timerStarted) {
            this.timerStarted = true;
            this.startTimer();
            this.updatePauseStatusDisplay();
            this.animateTimeBlink();
        }

        if (!this.pause) {
            const element = event.target;
            if (element.tagName === "LI" && !element.classList.contains("active")) {
                this.selectedCards.push(element);
                element.classList.add("active");
                element.classList.add("flipped");
                this.moves++;
                this.updateMovesDisplay();
                if (this.selectedCards.length === 2) {
                    this.pause = true;
                    if (this.selectedCards[0].id === this.selectedCards[1].id) {
                        this.selectedCards[0].classList.add("match");
                        this.selectedCards[1].classList.add("match");
                        this.deletedCards += 2;
                        this.selectedCards = [];
                        this.pause = false;
                    } else {
                        this.selectedCards[0].classList.add("no-match");
                        this.selectedCards[1].classList.add("no-match");
                        setTimeout(this.resetUnmatchedCards.bind(this), 600);
                    }
                }
            }
            this.checkGameStatus();
        }
    }

    updatePauseStatusDisplay() {
        const gameStatusText = document.querySelector(".game-status");
        if (!this.timerStarted) {
            gameStatusText.textContent = "Start matching to begin";
        } else if (this.isMouseOutsidePage) {
            gameStatusText.textContent = "Status: Game is on pause";
        } else {
            gameStatusText.textContent = "Status: Game is started";
        }
    }


    createCards() {
        this.cardsField.innerHTML = "";
        for (let card of this.shuffledCards) {
            const liEl = document.createElement("li");
            liEl.classList.add("card");
            const iEl = document.createElement("i");
            iEl.classList.add("fa", "fa-" + card);
            liEl.id = card;
            liEl.appendChild(iEl);
            this.cardsField.appendChild(liEl);
        }
    }

    resetUnmatchedCards() {
        for (const card of this.selectedCards) {
            card.classList.remove("active", "no-match", "flipped");
        }
        this.selectedCards = [];
        this.pause = false;
    }

    shuffleCards(array) {
        for (let index = array.length - 1; index > 0; index--) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
        }
        return array;
    }

    checkGameStatus() {
        if (this.deletedCards === this.countCards) {
            this.stopTimer();
            this.showCongratulationsDialog();
        }
    }

    updateMovesDisplay() {
        const movesElement = document.getElementById("moves");
        movesElement.textContent = `Moves: ${this.moves}`;
    }

    showCongratulationsDialog() {
        const closeButton = this.dialog.querySelector(".close-button");
        const newGameButton = this.dialog.querySelector(".new-game");

        const stats = this.dialog.querySelector(".stats");
        stats.textContent = `You matched all cards in ${this.moves} moves!`;

        closeButton.addEventListener("click", this.hideDialog.bind(this));
        newGameButton.addEventListener("click", this.restart.bind(this));

        this.dialog.style.opacity = "1";
        this.dialog.style.visibility = "visible";
        this.dialog.style.transform = "scale(1)";
    }

    hideDialog() {
        this.dialog.style.opacity = "0";
        this.dialog.style.visibility = "hidden";
        this.dialog.style.transform = "scale(1.1)";
    }

    startTimer() {
        if (MatchGrid.activeTimer !== null) {
            clearInterval(MatchGrid.activeTimer);
        }

        this.timerIntervalId = setInterval(this.updateTimer.bind(this), 1000);
        setTimeout(this.updateTimerDisplay.bind(this), 1000);
        MatchGrid.activeTimer = this.timerIntervalId;
    }

    stopTimer() {
        clearInterval(this.timerIntervalId);
        if (this.remainingTime === 0) {
            this.timerStarted = false;
        }

        MatchGrid.activeTimer = null;
    }

    updateTimer() {
        if (this.remainingTime > 0) {
            this.remainingTime--;
        } else {
            this.remainingTime = 0;
            this.stopTimer();
            this.showTimeoutDialog();
        }
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.remainingTime / 60);
        const seconds = this.remainingTime % 60;
        this.timerElement.textContent = `Time left: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    pauseTimer() {
        if (!this.pause && !this.isGameWon()) {
            this.pause = true;
            this.stopTimer();
        }
    }

    resumeTimer() {
        if (this.pause && !this.isGameWon()) {
            this.pause = false;
            this.startTimer();
            this.animateTimeBlink();
            this.updatePauseStatusDisplay();
        }
    }

    isGameWon() {
        return this.deletedCards === this.countCards;
    }

    showTimeoutDialog() {
        if (!this.isGameWon()) {
            const closeButton = this.dialog.querySelector(".close-button");
            const newGameButton = this.dialog.querySelector(".new-game");

            const dialogHeading = this.dialog.querySelector(".dialog-heading");
            dialogHeading.textContent = "Time's up!";

            const stats = this.dialog.querySelector(".stats");
            stats.textContent = `You matched ${this.deletedCards / 2} cards in ${this.moves} moves.`;

            closeButton.addEventListener("click", this.hideDialog.bind(this));
            newGameButton.addEventListener("click", this.restart.bind(this));

            this.dialog.style.opacity = "1";
            this.dialog.style.visibility = "visible";
            this.dialog.style.transform = "scale(1)";
            this.stopTimer();
        }
    }

    removeRestartButtonListener() {
        this.restartBtn.removeEventListener('click', this.handleRestartButtonClick);
    }

    addRestartButtonListener() {
        this.restartBtn.addEventListener('click', this.handleRestartButtonClick);
    }

    handleRestartButtonClick() {
        this.removeRestartButtonListener();
        this.restartBtn.disabled = true;

        const replayIcon = document.getElementById('reset-btn');
        replayIcon.classList.add('spinning');

        anime({
            targets: "#reset-btn",
            rotate: '1turn',
            easing: 'easeInOutSine',
            duration: 1000,
            complete: () => {
                replayIcon.classList.remove('spinning');

                anime({
                    targets: "#reset-btn",
                    rotate: '0turn',
                    duration: 0,
                });

                this.restart();
                this.restartBtn.disabled = false;
                this.addRestartButtonListener();
            }
        });
    }

    removeEventListeners() {
        this.cardsField.removeEventListener("click", this.handleCardClick);
        this.cardsField.removeEventListener("mouseenter", this.resumeTimer);
        this.cardsField.removeEventListener("mouseleave", this.handleMouseLeave);
    }

    restart() {
        this.stopTimer();
        this.removeEventListeners();
        this.remainingTime = this.timeLimit;
        this.timerStarted = false;
        this.shuffledCards = this.shuffleCards(this.cardsBase);
        this.selectedCards = [];
        this.pause = false;
        this.deletedCards = 0;
        this.moves = 0;
        this.updateMovesDisplay();
        this.updateTimerDisplay();
        this.resetUnmatchedCards();
        this.hideDialog();
        this.createCards();
        this.updatePauseStatusDisplay();
        this.initGame();
    }

    generateCardsBase(countCards) {
        const base = ["flask", "cogs", "space-shuttle", "bolt", "battery-2", "gamepad", "bluetooth", "hand-spock-o", "car", "globe", "leaf", "music"];
        const basePairs = base.slice(0, countCards / 2);
        return basePairs.concat(basePairs);
    }
}

// default arguments
const args = {
    width: 612,
    height: 500,
    columns: 4,
    rows: 4,
    timeLimit: 180,
    theme: {
        BoardColor: "linear-gradient(180deg, #2de2e6 0%, #035ee8 20%, #f6019d 36%, #9700cc 100%, #d40078 100%)",
        FieldColor: "linear-gradient(75deg, #ffd319, #ff901f, #ff2975, #c700b5, #b000ff)",
        Font: "font-family: 'VT323', monospace"
    }
};

const game = new MatchGrid(args);
game.startGame();
