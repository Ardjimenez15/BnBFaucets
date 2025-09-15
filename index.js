document.addEventListener('DOMContentLoaded', () => {
    const walletInput = document.getElementById('wallet-address');
    const claimButton = document.getElementById('claim-button');
    const statusMessage = document.getElementById('status-message');
    const recaptchaCheck = document.getElementById('recaptcha-check');
    const recaptchaCheckbox = document.getElementById('recaptcha-checkbox');
    const recaptchaIcon = document.getElementById('recaptcha-icon');
    const historyTableBody = document.getElementById('claim-history-table-body');
    const noHistoryMessage = document.getElementById('no-history-message');
    const mathProblemElement = document.getElementById('math-problem');
    const mathCaptchaInput = document.getElementById('math-captcha-input');
    
    const tabFaucet = document.getElementById('tab-faucet');
    const tabHistory = document.getElementById('tab-history');
    const tabDice = document.getElementById('tab-dice');
    const contentFaucet = document.getElementById('content-faucet');
    const contentHistory = document.getElementById('content-history');
    const contentDice = document.getElementById('content-dice');
    const rollButton = document.getElementById('roll-button');
    const diceResult = document.getElementById('dice-result');
    const diceMessage = document.getElementById('dice-message');
    const diceCooldownMessage = document.getElementById('dice-cooldown-message');

    // References to pop-up elements
    const diceModal = document.getElementById('dice-modal');
    const popupRecaptchaCheck = document.getElementById('popup-recaptcha-check');
    const popupRecaptchaCheckbox = document.getElementById('popup-recaptcha-checkbox');
    const popupRecaptchaIcon = document.getElementById('popup-recaptcha-icon');
    const popupConfirmButton = document.getElementById('popup-confirm-button');
    const popupMessage = document.getElementById('popup-message');
    const popupMathProblemElement = document.getElementById('popup-math-problem');
    const popupMathCaptchaInput = document.getElementById('popup-math-captcha-input');

    const COOLDOWN_KEY = 'faucet_last_claim_time';
    const HISTORY_KEY = 'faucet_claim_history';
    const COOLDOWN_MINUTES = 5;
    const COOLDOWN_MS = COOLDOWN_MINUTES * 60 * 1000;
    let recaptchaSolved = false;
    let popupRecaptchaSolved = false;
    
    // Constants for the dice timer
    const DICE_COOLDOWN_KEY = 'dice_last_roll_time';
    const DICE_COOLDOWN_MINUTES = 5;
    const DICE_COOLDOWN_MS = DICE_COOLDOWN_MINUTES * 60 * 1000;
    let diceIntervalId = null;

    // Variables for the mathematical captcha
    let captchaAnswer = 0;
    let popupCaptchaAnswer = 0;

    // Regular expression to validate an Ethereum/BNB wallet address
    const addressRegex = /^(0x)?[0-9a-fA-F]{40}$/;
    const diceEmojis = ['🎲', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

    // Function to show status messages
    function showMessage(text, colorClass) {
        statusMessage.textContent = text;
        statusMessage.className = `mt-6 text-center text-sm font-medium ${colorClass}`;
    }

    // Function to generate a new math problem
    function generateCaptcha() {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const operator = ['+', '-', '*'][Math.floor(Math.random() * 3)];
        let result = 0;

        switch (operator) {
            case '+':
                result = num1 + num2;
                break;
            case '-':
                result = num1 - num2;
                break;
            case '*':
                result = num1 * num2;
                break;
        }

        return {
            problem: `${num1} ${operator} ${num2} =`,
            answer: result
        };
    }
    
    // Function to validate the captcha and enable the button
    function validateAndEnableButton() {
        const isCaptchaCorrect = parseInt(mathCaptchaInput.value, 10) === captchaAnswer;
        // The button is enabled if reCAPTCHA is checked, the address is valid AND the captcha is correct.
        claimButton.disabled = !(recaptchaSolved && addressRegex.test(walletInput.value.trim()) && isCaptchaCorrect);
    }

    // Function to update the countdown timer
    function updateCountdown() {
        const lastClaimTime = localStorage.getItem(COOLDOWN_KEY);
        if (!lastClaimTime) {
            claimButton.textContent = `Reclamar 0.1 BNB`;
            validateAndEnableButton();
            if (recaptchaSolved) {
                 showMessage("El temporizador ha terminado. Puedes reclamar de nuevo.", "text-green-400");
            } else {
                 showMessage("Por favor, marca el reCAPTCHA y reclama.", "text-gray-400");
            }
            return;
        }

        const timeElapsed = Date.now() - parseInt(lastClaimTime, 10);
        const timeLeft = COOLDOWN_MS - timeElapsed;

        if (timeLeft <= 0) {
            location.reload();
        } else {
            claimButton.disabled = true;
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            claimButton.textContent = `En espera (${formattedTime})`;
            showMessage(`Por favor, espera ${COOLDOWN_MINUTES} minutos para reclamar de nuevo.`, "text-yellow-400");
        }
    }
    
    // Event to simulate reCAPTCHA resolution
    recaptchaCheck.addEventListener('click', () => {
        if (claimButton.disabled && !localStorage.getItem(COOLDOWN_KEY)) return;
        recaptchaSolved = !recaptchaSolved;
        if (recaptchaSolved) {
            recaptchaCheckbox.classList.add('bg-green-500');
            recaptchaIcon.classList.remove('opacity-0');
            validateAndEnableButton();
            showMessage("reCAPTCHA resuelto. ¡Puedes reclamar!", "text-green-400");
        } else {
            recaptchaCheckbox.classList.remove('bg-green-500');
            recaptchaIcon.classList.add('opacity-0');
            claimButton.disabled = true;
            showMessage("Por favor, marca el reCAPTCHA para reclamar.", "text-gray-400");
        }
    });

    // Real-time captcha validation
    mathCaptchaInput.addEventListener('keyup', () => {
        validateAndEnableButton();
    });
    walletInput.addEventListener('keyup', () => {
        validateAndEnableButton();
    });

    // Function to render the claim history in the table
    function renderClaimHistory() {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        historyTableBody.innerHTML = '';
        
        if (history.length === 0) {
            noHistoryMessage.classList.remove('hidden');
        } else {
            noHistoryMessage.classList.add('hidden');
            history.forEach(claim => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-600 transition-colors duration-200';
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-400">
                        ${claim.address.substring(0, 6)}...${claim.address.substring(claim.address.length - 4)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        ${claim.amount} BNB
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        ${claim.timestamp}
                    </td>
                `;
                historyTableBody.appendChild(row);
            });
        }
    }

    // Event handler for the claim button click
    claimButton.addEventListener('click', () => {
        const address = walletInput.value.trim();
        
        claimButton.disabled = true;
        claimButton.textContent = "Reclamando...";
        showMessage("Simulando una transacción...", "text-yellow-400");
        
        setTimeout(() => {
            const success = Math.random() < 0.8;

            if (success) {
                localStorage.setItem(COOLDOWN_KEY, Date.now());
                updateCountdown();
                showMessage("¡Éxito! 0.1 BNB enviados a tu billetera simulada.", "text-green-400");
                
                const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
                const newClaim = {
                    address: address,
                    amount: 0.1,
                    timestamp: new Date().toLocaleString()
                };
                history.unshift(newClaim);
                localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
                renderClaimHistory();

                walletInput.value = "";
                recaptchaSolved = false;
                recaptchaCheckbox.classList.remove('bg-green-500');
                recaptchaIcon.classList.add('opacity-0');
                const newCaptcha = generateCaptcha();
                mathProblemElement.textContent = newCaptcha.problem;
                captchaAnswer = newCaptcha.answer;
                mathCaptchaInput.value = "";
                validateAndEnableButton();

            } else {
                showMessage("Error de transacción simulada. Por favor, inténtalo de nuevo.", "text-red-400");
                claimButton.disabled = false;
                claimButton.textContent = "Reclamar 0.1 BNB";
            }
        }, 2000);
    });

    // Function to update the dice countdown
    function updateDiceCountdown() {
        const lastRollTime = localStorage.getItem(DICE_COOLDOWN_KEY);
        if (!lastRollTime) {
            rollButton.disabled = false;
            rollButton.textContent = `¡Tirar!`;
            diceCooldownMessage.textContent = `Puedes tirar de nuevo.`;
            return;
        }
        
        const timeElapsed = Date.now() - parseInt(lastRollTime, 10);
        const timeLeft = DICE_COOLDOWN_MS - timeElapsed;

        if (timeLeft <= 0) {
            rollButton.disabled = false;
            rollButton.textContent = `¡Tirar!`;
            diceCooldownMessage.textContent = `Puedes tirar de nuevo.`;
        } else {
            rollButton.disabled = true;
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            rollButton.textContent = `En espera (${formattedTime})`;
            diceCooldownMessage.textContent = `Por favor, espera ${DICE_COOLDOWN_MINUTES} minutos para volver a tirar.`;
        }
    }
    
    function validateAndEnablePopup() {
        const isCaptchaCorrect = parseInt(popupMathCaptchaInput.value, 10) === popupCaptchaAnswer;
        popupConfirmButton.disabled = !(popupRecaptchaSolved && isCaptchaCorrect);
    }

    // Event handlers for the tabs
    function switchTab(tabToActivate, contentToShow) {
        const allTabs = [tabFaucet, tabHistory, tabDice];
        const allContents = [contentFaucet, contentHistory, contentDice];

        allTabs.forEach(tab => {
            tab.classList.remove('active', 'bg-[#2d3748]', 'text-[#fbd38d]');
            tab.classList.add('inactive', 'bg-[#4a5568]', 'text-[#a0aec0]');
        });
        
        allContents.forEach(content => content.classList.add('hidden'));

        tabToActivate.classList.remove('inactive', 'bg-[#4a5568]', 'text-[#a0aec0]');
        tabToActivate.classList.add('active', 'bg-[#2d3748]', 'text-[#fbd38d]');
        contentToShow.classList.remove('hidden');

        if (diceIntervalId) {
            clearInterval(diceIntervalId);
            diceIntervalId = null;
        }
        
        if (tabToActivate === tabDice) {
            updateDiceCountdown();
            diceIntervalId = setInterval(updateDiceCountdown, 1000);
        }
    }

    tabFaucet.addEventListener('click', () => switchTab(tabFaucet, contentFaucet));
    tabHistory.addEventListener('click', () => switchTab(tabHistory, contentHistory));
    tabDice.addEventListener('click', () => switchTab(tabDice, contentDice));

    // Logic for the dice roll
    rollButton.addEventListener('click', () => {
        const newCaptcha = generateCaptcha();
        popupMathProblemElement.textContent = newCaptcha.problem;
        popupCaptchaAnswer = newCaptcha.answer;
        popupMathCaptchaInput.value = "";
        diceModal.classList.remove('hidden');
        popupRecaptchaSolved = false;
        popupRecaptchaCheckbox.classList.remove('bg-green-500');
        popupRecaptchaIcon.classList.add('opacity-0');
        popupConfirmButton.disabled = true;
        popupMessage.textContent = "Por favor, completa la verificación.";
    });
    
    // Add a mousedown listener to the button to show a message if it's disabled
    rollButton.addEventListener('mousedown', () => {
        if (rollButton.disabled) {
            diceMessage.textContent = diceCooldownMessage.textContent;
        } else {
            diceMessage.textContent = '';
        }
    });

    // Logic for the pop-up reCAPTCHA
    popupRecaptchaCheck.addEventListener('click', () => {
        popupRecaptchaSolved = !popupRecaptchaSolved;
        if (popupRecaptchaSolved) {
            popupRecaptchaCheckbox.classList.add('bg-green-500');
            popupRecaptchaIcon.classList.remove('opacity-0');
            validateAndEnablePopup();
            popupMessage.textContent = "Verificación completada. ¡Confirma para tirar!";
        } else {
            popupRecaptchaCheckbox.classList.remove('bg-green-500');
            popupRecaptchaIcon.classList.add('opacity-0');
            popupConfirmButton.disabled = true;
            popupMessage.textContent = "Por favor, completa la verificación.";
        }
    });

    popupMathCaptchaInput.addEventListener('keyup', () => {
        validateAndEnablePopup();
    });

    // Logic for the confirmation button in the pop-up
    popupConfirmButton.addEventListener('click', () => {
        const userCaptchaAnswer = parseInt(popupMathCaptchaInput.value, 10);
        if (!popupRecaptchaSolved) {
            popupMessage.textContent = "Debes completar la verificación de reCAPTCHA.";
            return;
        }
        if (userCaptchaAnswer !== popupCaptchaAnswer) {
            popupMessage.textContent = "Respuesta anti-bot incorrecta. Inténtalo de nuevo.";
            const newCaptcha = generateCaptcha();
            popupMathProblemElement.textContent = newCaptcha.problem;
            popupCaptchaAnswer = newCaptcha.answer;
            popupMathCaptchaInput.value = "";
            return;
        }
        diceModal.classList.add('hidden');
        performDiceRoll();
    });

    function performDiceRoll() {
        rollButton.disabled = true;
        diceResult.textContent = diceEmojis[0];
        diceMessage.textContent = "Tirando...";
        
        setTimeout(() => {
            const result = Math.floor(Math.random() * 6) + 1;
            diceResult.textContent = diceEmojis[result];
            diceMessage.textContent = `¡Has sacado un ${result}!`;
            rollButton.disabled = false;
            localStorage.setItem(DICE_COOLDOWN_KEY, Date.now());
        }, 1000);
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
    renderClaimHistory();

    const initialCaptcha = generateCaptcha();
    mathProblemElement.textContent = initialCaptcha.problem;
    captchaAnswer = initialCaptcha.answer;
});
