class FinanceManager {
    constructor() {
        this.data = this.loadData();
        this.init();
    }

    init() {
        this.updateDisplay();
        this.setCurrentDate();
        this.bindEvents();
    }

    loadData() {
        const defaultData = {
            cash: 0,
            instapay: 0,
            loans: []
        };
        
        const savedData = localStorage.getItem('financeData');
        return savedData ? { ...defaultData, ...JSON.parse(savedData) } : defaultData;
    }

    saveData() {
        localStorage.setItem('financeData', JSON.stringify(this.data));
    }

    setCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
    }

    updateDisplay() {
        this.updateBalance('cash', this.data.cash);
        this.updateBalance('instapay', this.data.instapay);
        this.updateTotalBalance();
        this.displayLoans();
        this.updateLendingSummary();
    }

    updateBalance(type, amount) {
        const element = document.getElementById(`${type}Balance`);
        element.textContent = this.formatCurrency(amount);
        element.parentElement.classList.add('animate-balance');
        setTimeout(() => {
            element.parentElement.classList.remove('animate-balance');
        }, 600);
    }

    updateTotalBalance() {
        const total = this.data.cash + this.data.instapay;
        const element = document.getElementById('totalBalance');
        element.textContent = this.formatCurrency(total);
        
        // Add animation
        element.parentElement.classList.add('animate-balance');
        setTimeout(() => {
            element.parentElement.classList.remove('animate-balance');
        }, 600);
    }

    formatCurrency(amount) {
        return amount.toFixed(2);
    }

    addMoney(type) {
        const input = document.getElementById(`${type}Input`);
        const amount = parseFloat(input.value);
        
        if (!amount || amount <= 0) {
            this.showError(input, 'Please enter a valid amount');
            return;
        }

        this.data[type] += amount;
        input.value = '';
        this.saveData();
        this.updateDisplay();
        this.showSuccess(input, 'Money added successfully!');
    }

    removeMoney(type) {
        const input = document.getElementById(`${type}Input`);
        const amount = parseFloat(input.value);
        
        if (!amount || amount <= 0) {
            this.showError(input, 'Please enter a valid amount');
            return;
        }

        if (amount > this.data[type]) {
            this.showError(input, 'Insufficient funds');
            return;
        }

        this.data[type] -= amount;
        input.value = '';
        this.saveData();
        this.updateDisplay();
        this.showSuccess(input, 'Money removed successfully!');
    }

    showError(input, message) {
        input.classList.add('shake');
        input.style.borderColor = '#f5576c';
        
        // Create and show error message
        const errorDiv = document.createElement('div');
        errorDiv.textContent = message;
        errorDiv.style.color = '#f5576c';
        errorDiv.style.fontSize = '0.9rem';
        errorDiv.style.marginTop = '5px';
        errorDiv.className = 'error-message';
        
        // Remove existing error messages
        const existingError = input.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        input.parentElement.appendChild(errorDiv);
        
        setTimeout(() => {
            input.classList.remove('shake');
            input.style.borderColor = '';
            errorDiv.remove();
        }, 3000);
    }

    showSuccess(input, message) {
        input.parentElement.classList.add('success-flash');
        
        // Create and show success message
        const successDiv = document.createElement('div');
        successDiv.textContent = message;
        successDiv.style.color = '#4facfe';
        successDiv.style.fontSize = '0.9rem';
        successDiv.style.marginTop = '5px';
        successDiv.className = 'success-message';
        
        input.parentElement.appendChild(successDiv);
        
        setTimeout(() => {
            input.parentElement.classList.remove('success-flash');
            successDiv.remove();
        }, 2000);
    }

    addLoan() {
        const amount = parseFloat(document.getElementById('loanAmount').value);
        const borrowerName = document.getElementById('borrowerName').value.trim();
        const paybackDate = document.getElementById('paybackDate').value;

        if (!amount || amount <= 0) {
            this.showError(document.getElementById('loanAmount'), 'Please enter a valid amount');
            return;
        }

        const loan = {
            id: Date.now(),
            amount: amount,
            borrowerName: borrowerName || 'Unknown',
            paybackDate: paybackDate,
            dateCreated: new Date().toISOString().split('T')[0]
        };

        this.data.loans.push(loan);
        this.saveData();
        this.updateDisplay();
        this.closeAddLoanModal();
        this.clearLoanForm();
    }

    repayLoan(loanId) {
        const loanIndex = this.data.loans.findIndex(loan => loan.id === loanId);
        if (loanIndex !== -1) {
            const loan = this.data.loans[loanIndex];
            
            // Add the loan amount back to cash
            this.data.cash += loan.amount;
            
            // Remove the loan
            this.data.loans.splice(loanIndex, 1);
            
            this.saveData();
            this.updateDisplay();
            
            // Show success message
            this.showNotification('Loan repaid successfully!', 'success');
        }
    }

    displayLoans() {
        const container = document.getElementById('loansContainer');
        const noLoans = document.getElementById('noLoans');
        
        if (this.data.loans.length === 0) {
            noLoans.style.display = 'block';
            return;
        }
        
        noLoans.style.display = 'none';
        
        // Clear existing loan cards (except no-loans message)
        const existingCards = container.querySelectorAll('.loan-card');
        existingCards.forEach(card => card.remove());
        
        this.data.loans.forEach(loan => {
            const loanCard = this.createLoanCard(loan);
            container.appendChild(loanCard);
        });
    }

    createLoanCard(loan) {
        const card = document.createElement('div');
        card.className = 'loan-card';
        
        const paybackDateText = loan.paybackDate ? 
            new Date(loan.paybackDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            }) : 'No date set';
            
        const isOverdue = loan.paybackDate && new Date(loan.paybackDate) < new Date();
        const overdueClass = isOverdue ? 'style="color: #f5576c;"' : '';
        
        card.innerHTML = `
            <div class="loan-header">
                <div class="loan-amount">$${this.formatCurrency(loan.amount)}</div>
                <button class="btn-repaid" onclick="financeManager.repayLoan(${loan.id})">
                    <i class="fas fa-check"></i> Loan Repaid
                </button>
            </div>
            <div class="loan-details">
                <div class="loan-detail">
                    <strong>Borrower</strong>
                    <span>${loan.borrowerName}</span>
                </div>
                <div class="loan-detail">
                    <strong>Expected Payback</strong>
                    <span ${overdueClass}>${paybackDateText}</span>
                </div>
                <div class="loan-detail">
                    <strong>Date Lent</strong>
                    <span>${new Date(loan.dateCreated).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                    })}</span>
                </div>
            </div>
        `;
        
        return card;
    }

    updateLendingSummary() {
        const totalLent = this.data.loans.reduce((sum, loan) => sum + loan.amount, 0);
        document.getElementById('totalLent').textContent = this.formatCurrency(totalLent);
    }

    showAddLoanModal() {
        document.getElementById('loanModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Focus on amount input
        setTimeout(() => {
            document.getElementById('loanAmount').focus();
        }, 100);
    }

    closeAddLoanModal() {
        document.getElementById('loanModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    clearLoanForm() {
        document.getElementById('loanAmount').value = '';
        document.getElementById('borrowerName').value = '';
        document.getElementById('paybackDate').value = '';
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'};
            color: white;
            padding: 15px 25px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 10000;
            font-weight: 600;
            animation: slideInRight 0.3s ease-out;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    bindEvents() {
        // Enter key support for inputs
        ['cashInput', 'instapayInput'].forEach(inputId => {
            const input = document.getElementById(inputId);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const type = inputId.replace('Input', '');
                    this.addMoney(type);
                }
            });
        });

        // Modal events
        document.getElementById('loanModal').addEventListener('click', (e) => {
            if (e.target.id === 'loanModal') {
                this.closeAddLoanModal();
            }
        });

        // Loan form events
        document.getElementById('loanAmount').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addLoan();
            }
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAddLoanModal();
            }
        });
    }
}

// Global functions for HTML onclick events
function addMoney(type) {
    financeManager.addMoney(type);
}

function removeMoney(type) {
    financeManager.removeMoney(type);
}

function showAddLoanModal() {
    financeManager.showAddLoanModal();
}

function closeAddLoanModal() {
    financeManager.closeAddLoanModal();
}

function addLoan() {
    financeManager.addLoan();
}

// Add custom CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the app
const financeManager = new FinanceManager();

// Add some extra interactivity
document.addEventListener('DOMContentLoaded', () => {
    // Add hover effects to cards
    const cards = document.querySelectorAll('.balance-card, .total-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Update time every minute
    setInterval(() => {
        financeManager.setCurrentDate();
    }, 60000);
});