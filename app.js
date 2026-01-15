// Contracts are loaded from contracts.js globally

class FuturesCalculator {
    constructor() {
        this.selectedContract = contracts[0]; // Default to ES
        this.riskAmount = 0;
        this.stopLossTicks = 0;
        this.commission = 0; // Per Round Trip

        this.initElements();
        this.loadSettings(); // Load saved data
        this.populateContracts();

        // Set initial state from loaded settings
        if (this.savedContract) {
            const found = contracts.find(c => c.symbol === this.savedContract);
            if (found) this.selectedContract = found;
        }

        // Load commission from contract if not manually saved, or override?
        // User wants automatic, so let's default to the contract's fee on load/change
        // But if they saved a custom one, maybe keep it? 
        // Actually, user said "I want fee part automatically", implying they don't want to type it.
        // So let's prioritize the contract's default fee.

        this.commission = this.selectedContract.commission;
        this.commInput.value = this.commission.toFixed(2);

        if (this.savedRisk) this.riskInput.value = this.savedRisk;
        if (this.savedStop) this.stopInput.value = this.savedStop;

        // Sync internal state
        this.riskAmount = parseFloat(this.riskInput.value) || 0;
        this.stopLossTicks = parseFloat(this.stopInput.value) || 0;

        this.initEvents();
        this.updateContractInfo();
        this.updateUI(); // Set correct theme icon etc
        this.calculate();
    }

    initElements() {
        this.contractSelect = document.getElementById('contract-select');
        this.riskInput = document.getElementById('risk-input');
        this.stopInput = document.getElementById('stop-input');
        this.commInput = document.getElementById('commission-input');
        this.themeBtn = document.getElementById('theme-toggle');

        this.resultContracts = document.getElementById('result-contracts');
        this.resultRiskPerStop = document.getElementById('result-risk-per-stop');
        this.resultTotalRisk = document.getElementById('result-total-risk');
        this.resultFees = document.getElementById('result-total-fees');
        this.resultNet = document.getElementById('result-net-total');

        this.infoTickValue = document.getElementById('info-tick-value');
        this.infoTickSize = document.getElementById('info-tick-size');
    }

    initEvents() {
        // Theme Toggle
        this.themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            this.saveSettings();
        });

        this.contractSelect.addEventListener('change', (e) => {
            const symbol = e.target.value;
            this.selectedContract = contracts.find(c => c.symbol === symbol);

            // Auto-update commission for Tradovate
            this.commission = this.selectedContract.commission;
            this.commInput.value = this.commission.toFixed(2);

            this.calculate();
            this.updateContractInfo();
            this.saveSettings();
        });

        // Universal input handler
        [this.riskInput, this.stopInput, this.commInput].forEach(input => {
            input.addEventListener('input', () => {
                this.riskAmount = parseFloat(this.riskInput.value) || 0;
                this.stopLossTicks = parseFloat(this.stopInput.value) || 0;
                this.commission = parseFloat(this.commInput.value) || 0;
                this.calculate();
                this.saveSettings();
            });
        });
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('futuresCalcSettings'));
        if (settings) {
            this.savedContract = settings.contract;
            this.savedRisk = settings.risk;
            this.savedStop = settings.stop;
            this.savedComm = settings.comm;
            if (settings.theme === 'light') {
                document.body.classList.add('light-mode');
            }
        }
    }

    saveSettings() {
        const settings = {
            contract: this.selectedContract.symbol,
            risk: this.riskInput.value,
            stop: this.stopInput.value,
            comm: this.commInput.value,
            theme: document.body.classList.contains('light-mode') ? 'light' : 'dark'
        };
        localStorage.setItem('futuresCalcSettings', JSON.stringify(settings));
    }

    populateContracts() {
        const groups = {};
        contracts.forEach(contract => {
            if (!groups[contract.group]) {
                groups[contract.group] = [];
            }
            groups[contract.group].push(contract);
        });

        // Clear existing options
        this.contractSelect.innerHTML = '';

        for (const [groupName, groupContracts] of Object.entries(groups)) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = groupName;

            groupContracts.forEach(c => {
                const option = document.createElement('option');
                option.value = c.symbol;
                option.textContent = `${c.symbol} - ${c.name}`;
                if (c.symbol === this.selectedContract.symbol) option.selected = true;
                optgroup.appendChild(option);
            });

            this.contractSelect.appendChild(optgroup);
        }
    }

    updateContractInfo() {
        this.infoTickValue.textContent = `$${this.selectedContract.tickValue.toFixed(2)}`;
        this.infoTickSize.textContent = `${this.selectedContract.tickSize}`;
    }

    calculate() {
        if (this.riskAmount <= 0 || this.stopLossTicks <= 0) {
            this.updateResults(0, 0, 0, 0, 0);
            return;
        }

        const riskPerContract = this.stopLossTicks * this.selectedContract.tickValue;

        // 1. Enforce Minimum Risk of $200 (User Request)
        let riskToUse = this.riskAmount;
        if (riskToUse < 200) {
            riskToUse = 200;
        }

        // 2. Round UP (Ceil) to ensure we always meet or exceed that risk
        const numberOfContracts = Math.ceil(riskToUse / riskPerContract);
        const actualTotalRisk = numberOfContracts * riskPerContract;

        // Fee Calc (Round Trip)
        const totalFees = numberOfContracts * this.commission; // Assuming input is RT
        const netTotal = actualTotalRisk + totalFees; // Risk + Fees = Total Cost if stopped out? 
        // Usually Risk is the loss. Fees are extra loss. So Total Loss = Risk + Fees.

        this.updateResults(numberOfContracts, riskPerContract, actualTotalRisk, totalFees, netTotal);
    }

    updateResults(count, riskPerOne, totalRisk, fees, netTotal) {
        // Animate numbers (simple implementation)
        this.resultContracts.textContent = count;
        this.resultRiskPerStop.textContent = `$${riskPerOne.toFixed(2)}`;
        this.resultTotalRisk.textContent = `$${totalRisk.toFixed(2)}`;
        this.resultFees.textContent = `$${fees.toFixed(2)}`;
        this.resultNet.textContent = `$${netTotal.toFixed(2)}`;

        // Dynamic color for valid results
        if (count > 0) {
            this.resultContracts.classList.add('has-value');
        } else {
            this.resultContracts.classList.remove('has-value');
        }
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    new FuturesCalculator();
});
