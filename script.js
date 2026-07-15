const balanceEl = document.getElementById('balance');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const transactionsList = document.getElementById('transactions-list');
const form = document.getElementById('transaction-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const typeSelect = document.getElementById('type');
const clearAllBtn = document.getElementById('clear-all');
const filterBtns = document.querySelectorAll('.filter-btn');

// State
let transactions = [];
let currentFilter = 'all';

function loadTransactions() {
    const stored = localStorage.getItem('transactions');
    if (stored) {
        transactions = JSON.parse(stored);
    }
}

// Save to localStorage
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format currency
function formatCurrency(amount) {
    return '₦' + Math.abs(amount).toFixed(2);
}

// Calculate totals
function calculateTotals() {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    return { totalIncome, totalExpense, balance };
}

// Update UI with totals
function updateTotals() {
    const { totalIncome, totalExpense, balance } = calculateTotals();

    balanceEl.textContent = formatCurrency(balance);
    totalIncomeEl.textContent = formatCurrency(totalIncome);
    totalExpenseEl.textContent = formatCurrency(totalExpense);

    // Change balance color
    balanceEl.classList.remove('positive', 'negative', 'neutral');
    if (balance > 0) {
        balanceEl.classList.add('positive');
    } else if (balance < 0) {
        balanceEl.classList.add('negative');
    } else {
        balanceEl.classList.add('neutral');
    }
}

// Get filtered transactions
function getFilteredTransactions() {
    if (currentFilter === 'all') {
        return transactions;
    }
    return transactions.filter(t => t.type === currentFilter);
}

// Render transactions
function renderTransactions() {
    const filtered = getFilteredTransactions();

    if (filtered.length === 0) {
        transactionsList.innerHTML = `<p class="empty-msg">No transactions yet. Add one above.</p>`;
        return;
    }

    // Sort by date (newest first)
    const sorted = [...filtered].sort((a, b) => b.date - a.date);

    transactionsList.innerHTML = sorted.map(t => `
        <div class="transaction-item ${t.type}">
            <div class="transaction-info">
                <span class="desc">${escapeHtml(t.description)}</span>
                <span class="category">${escapeHtml(t.category)}</span>
                <span class="date">${new Date(t.date).toLocaleDateString()} ${new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <span class="transaction-amount ${t.type}">
                ${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.amount)}
            </span>
            <button class="delete-btn" data-id="${t.id}">×</button>
        </div>
    `).join('');

    // Add delete event listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            deleteTransaction(id);
        });
    });
}

// Simple escape function to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show toast notification
function showToast(message, type = 'success') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add transaction
function addTransaction(e) {
    e.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;
    const type = typeSelect.value;

    if (!description || !amount || !category) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    const transaction = {
        id: generateId(),
        description,
        amount,
        category: categorySelect.options[categorySelect.selectedIndex].text,
        type,
        date: Date.now()
    };

    transactions.push(transaction);
    saveTransactions();
    updateUI();

    // Reset form
    form.reset();
    descriptionInput.focus();

    showToast('Transaction added successfully', 'success');
}

// Delete transaction
function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        updateUI();
        showToast('Transaction deleted', 'error');
    }
}

// Clear all transactions
function clearAllTransactions() {
    if (transactions.length === 0) {
        showToast('No transactions to clear', 'error');
        return;
    }

    if (confirm('Are you sure you want to delete ALL transactions?')) {
        transactions = [];
        saveTransactions();
        updateUI();
        showToast('All transactions cleared', 'error');
    }
}

// Update entire UI
function updateUI() {
    updateTotals();
    renderTransactions();
}

// Handle filter buttons
function handleFilter(filter) {
    currentFilter = filter;
    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderTransactions();
}

// Event Listeners
form.addEventListener('submit', addTransaction);
clearAllBtn.addEventListener('click', clearAllTransactions);

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        handleFilter(btn.dataset.filter);
    });
});

loadTransactions();
updateUI();

// Auto-save on page close
window.addEventListener('beforeunload', saveTransactions);

console.log('Expense Tracker loaded');
console.log('Transactions:', transactions.length);