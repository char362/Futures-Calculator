// Contracts are loaded from contracts.js globally

class FuturesCalculator {
    constructor() {
        this.selectedContract = contracts[0]; // Default to ES
        this.riskAmount = 0;
        this.stopLossTicks = 0;

        this.initElements();
        this.initEvents();
        this.populateContracts();
        this.updateUI();
    }

    initElements() {
        this.contractSelect = document.getElementById('contract-select');
        this.riskInput = document.getElementById('risk-input');
        this.stopInput = document.getElementById('stop-input');

        this.resultContracts = document.getElementById('result-contracts');
        this.resultRiskPerStop = document.getElementById('result-risk-per-stop');
        this.resultTotalRisk = document.getElementById('result-total-risk');

        this.infoTickValue = document.getElementById('info-tick-value');
        this.infoTickSize = document.getElementById('info-tick-size');
    }

    initEvents() {
        this.contractSelect.addEventListener('change', (e) => {
            const symbol = e.target.value;
            this.selectedContract = contracts.find(c => c.symbol === symbol);
            this.calculate();
            this.updateContractInfo();
        });

        this.riskInput.addEventListener('input', (e) => {
            this.riskAmount = parseFloat(e.target.value) || 0;
            this.calculate();
        });

        this.stopInput.addEventListener('input', (e) => {
            this.stopLossTicks = parseFloat(e.target.value) || 0;
            this.calculate();
        });
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
                if (c.symbol === 'ES') option.selected = true;
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
            this.updateResults(0, 0, 0);
            return;
        }

        const riskPerContract = this.stopLossTicks * this.selectedContract.tickValue;

        // Floor the result to ensure we don't exceed risk
        const numberOfContracts = Math.floor(this.riskAmount / riskPerContract);
        const actualTotalRisk = numberOfContracts * riskPerContract;

        this.updateResults(numberOfContracts, riskPerContract, actualTotalRisk);
    }

    updateResults(count, riskPerOne, totalRisk) {
        // Animate numbers (simple implementation)
        this.resultContracts.textContent = count;
        this.resultRiskPerStop.textContent = `$${riskPerOne.toFixed(2)}`;
        this.resultTotalRisk.textContent = `$${totalRisk.toFixed(2)}`;

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
