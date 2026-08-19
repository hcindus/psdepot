// ReggieStarr RS-79 POS Web Application
class ReggieStarrPOS {
    constructor() {
        this.items = [];
        this.pluInput = '';
        this.taxRate = 0.085;
        this.discount = { type: null, value: 0 };
        this.currentPaymentMethod = null;
        this.transactionId = this.generateTransactionId();
        
        // Product database
        this.products = {
            'BURGER': { name: 'Burger', price: 8.99, department: 'Food' },
            'FRIES': { name: 'Fries', price: 3.99, department: 'Food' },
            'SODA': { name: 'Soda', price: 2.49, department: 'Beverage' },
            'SHAKE': { name: 'Shake', price: 4.99, department: 'Beverage' },
            'SALAD': { name: 'Salad', price: 6.99, department: 'Food' },
            'COFFEE': { name: 'Coffee', price: 1.99, department: 'Beverage' },
            '1001': { name: 'Hamburger', price: 6.99, department: 'Food' },
            '1002': { name: 'Cheeseburger', price: 7.99, department: 'Food' },
            '1003': { name: 'Double Burger', price: 9.99, department: 'Food' },
            '2001': { name: 'Small Fries', price: 2.99, department: 'Food' },
            '2002': { name: 'Large Fries', price: 4.99, department: 'Food' },
            '3001': { name: 'Coca-Cola', price: 2.49, department: 'Beverage' },
            '3002': { name: 'Diet Coke', price: 2.49, department: 'Beverage' },
            '3003': { name: 'Sprite', price: 2.49, department: 'Beverage' },
            '4001': { name: 'Vanilla Shake', price: 4.99, department: 'Beverage' },
            '4002': { name: 'Chocolate Shake', price: 4.99, department: 'Beverage' },
            '5001': { name: 'Caesar Salad', price: 6.99, department: 'Food' },
            '5002': { name: 'Garden Salad', price: 5.99, department: 'Food' },
        };
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        this.render();
    }
    
    generateTransactionId() {
        return 'TXN-' + Date.now().toString(36).toUpperCase();
    }
    
    cacheElements() {
        this.receiptItems = document.getElementById('receiptItems');
        this.subtotalEl = document.getElementById('subtotal');
        this.taxAmountEl = document.getElementById('taxAmount');
        this.discountLine = document.getElementById('discountLine');
        this.discountAmountEl = document.getElementById('discountAmount');
        this.grandTotalEl = document.getElementById('grandTotal');
        this.pluValue = document.getElementById('pluValue');
        this.statusText = document.getElementById('statusText');
        this.currentTime = document.getElementById('currentTime');
    }
    
    bindEvents() {
        // Quick items
        document.querySelectorAll('.quick-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const plu = e.currentTarget.dataset.plu;
                this.addItemByPLU(plu);
            });
        });
        
        // Keypad
        document.querySelectorAll('.key').forEach(key => {
            key.addEventListener('click', (e) => {
                const keyVal = e.target.dataset.key;
                this.handleKeypad(keyVal);
            });
        });
        
        // Payment methods
        document.querySelectorAll('.payment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const method = e.currentTarget.dataset.method;
                this.processPayment(method);
            });
        });
        
        // Header buttons
        document.getElementById('voidBtn').addEventListener('click', () => this.showVoidModal());
        document.getElementById('discBtn').addEventListener('click', () => this.showDiscountModal());
        document.getElementById('holdBtn').addEventListener('click', () => this.holdTransaction());
        
        // Footer buttons
        document.getElementById('printReceipt').addEventListener('click', () => this.printReceipt());
        document.getElementById('clearAll').addEventListener('click', () => this.clearAll());
    }
    
    updateTime() {
        if (this.currentTime) {
            this.currentTime.textContent = new Date().toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
        }
    }
    
    handleKeypad(key) {
        switch(key) {
            case 'C':
                this.pluInput = '';
                break;
            case 'ENT':
                if (this.pluInput) {
                    this.addItemByPLU(this.pluInput);
                    this.pluInput = '';
                }
                break;
            default:
                if (this.pluInput.length < 10) {
                    this.pluInput += key;
                }
        }
        this.updatePLUDisplay();
    }
    
    updatePLUDisplay() {
        if (this.pluValue) {
            this.pluValue.textContent = this.pluInput;
        }
    }
    
    addItemByPLU(plu) {
        const product = this.products[plu.toUpperCase()];
        if (product) {
            // Check if item already exists
            const existingItem = this.items.find(item => item.plu === plu.toUpperCase() && !item.voided);
            if (existingItem) {
                existingItem.qty += 1;
                existingItem.total = existingItem.qty * existingItem.price;
            } else {
                this.items.push({
                    id: Date.now(),
                    plu: plu.toUpperCase(),
                    name: product.name,
                    price: product.price,
                    qty: 1,
                    total: product.price,
                    voided: false
                });
            }
            this.showToast(`Added ${product.name}`);
            this.render();
        } else {
            this.showToast('Invalid PLU code');
        }
    }
    
    calculateTotals() {
        const activeItems = this.items.filter(item => !item.voided);
        const subtotal = activeItems.reduce((sum, item) => sum + item.total, 0);
        
        let discountAmount = 0;
        if (this.discount.type === 'percentage') {
            discountAmount = subtotal * (this.discount.value / 100);
        } else if (this.discount.type === 'flat') {
            discountAmount = this.discount.value;
        }
        
        const afterDiscount = Math.max(0, subtotal - discountAmount);
        const tax = afterDiscount * this.taxRate;
        const total = afterDiscount + tax;
        
        return { subtotal, tax, discountAmount, total };
    }
    
    render() {
        const totals = this.calculateTotals();
        
        // Render items
        if (this.receiptItems) {
            this.receiptItems.innerHTML = this.items.map(item => `
                <div class="receipt-item ${item.voided ? 'voided' : ''}" data-id="${item.id}">
                    <div class="receipt-item-left">
                        <div class="item-qty">${item.qty}</div>
                        <div class="item-details">
                            <h4>${item.name}</h4>
                            <p>$${item.price.toFixed(2)} @ ${item.plu}</p>
                        </div>
                    </div>
                    <div class="item-price">$${item.total.toFixed(2)}</div>
                </div>
            `).join('');
        }
        
        // Update totals
        if (this.subtotalEl) this.subtotalEl.textContent = `$${totals.subtotal.toFixed(2)}`;
        if (this.taxAmountEl) this.taxAmountEl.textContent = `$${totals.tax.toFixed(2)}`;
        if (this.grandTotalEl) this.grandTotalEl.textContent = `$${totals.total.toFixed(2)}`;
        
        // Show/hide discount line
        if (this.discountLine) {
            if (totals.discountAmount > 0) {
                this.discountLine.style.display = 'flex';
                this.discountAmountEl.textContent = `-$${totals.discountAmount.toFixed(2)}`;
            } else {
                this.discountLine.style.display = 'none';
            }
        }
    }
    
    showVoidModal() {
        if (this.items.length === 0) {
            this.showToast('No items to void');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Void Item</h2>
                </div>
                <div class="modal-body">
                    <p>Select item to void:</p>
                    <div style="max-height: 200px; overflow-y: auto; margin-top: 1rem;">
                        ${this.items.filter(i => !i.voided).map(item => `
                            <div class="list-item" style="cursor: pointer; padding: 0.75rem; border: 1px solid var(--border); margin-bottom: 0.5rem; border-radius: 6px;" data-void-id="${item.id}">
                                <span>${item.name} ($${item.total.toFixed(2)})</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancelVoid">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelectorAll('[data-void-id]').forEach(el => {
            el.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.voidId);
                this.voidItem(id);
                modal.remove();
            });
        });
        
        modal.querySelector('#cancelVoid').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    
    voidItem(id) {
        const item = this.items.find(i => i.id === id);
        if (item) {
            item.voided = true;
            this.showToast(`Voided: ${item.name}`);
            this.render();
        }
    }
    
    showDiscountModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Apply Discount</h2>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Discount Type</label>
                        <select class="form-input" id="discType">
                            <option value="percentage">Percentage (%)</option>
                            <option value="flat">Flat Amount ($)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Value</label>
                        <input type="number" class="form-input" id="discValue" placeholder="Enter value" step="0.01">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancelDisc">Cancel</button>
                    <button class="btn btn-primary" id="applyDisc">Apply</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('#applyDisc').addEventListener('click', () => {
            const type = document.getElementById('discType').value;
            const value = parseFloat(document.getElementById('discValue').value) || 0;
            if (value > 0) {
                this.discount = { type, value };
                this.showToast(`Applied ${type === 'percentage' ? value + '%' : '$' + value.toFixed(2)} discount`);
                this.render();
            }
            modal.remove();
        });
        
        modal.querySelector('#cancelDisc').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    
    holdTransaction() {
        if (this.items.length === 0) {
            this.showToast('No items to hold');
            return;
        }
        this.showToast('Transaction held (simulated)');
    }
    
    processPayment(method) {
        const totals = this.calculateTotals();
        
        if (totals.total <= 0) {
            this.showToast('No items in transaction');
            return;
        }
        
        // Update payment method UI
        document.querySelectorAll('.payment-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.method === method);
        });
        
        this.currentPaymentMethod = method;
        
        // Simulate processing
        this.statusText.textContent = `Processing ${method.toUpperCase()}...`;
        this.statusText.parentElement.classList.add('success');
        
        setTimeout(() => {
            this.showToast(`Payment processed: ${method.toUpperCase()} $${totals.total.toFixed(2)}`);
            this.statusText.textContent = 'Payment Complete';
            
            setTimeout(() => {
                this.statusText.textContent = 'Ready';
                this.statusText.parentElement.classList.remove('success');
                this.printReceipt();
                this.clearAll();
            }, 1500);
        }, 1000);
    }
    
    printReceipt() {
        const totals = this.calculateTotals();
        const activeItems = this.items.filter(item => !item.voided);
        
        if (activeItems.length === 0) {
            this.showToast('Nothing to print');
            return;
        }
        
        const receipt = `
================================
     REGGIESTARR RS-79 POS
================================
Transaction: ${this.transactionId}
Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
--------------------------------
${activeItems.map(item => 
    `${item.name.padEnd(20)} $${item.total.toFixed(2).padStart(8)}`
).join('\n')}
--------------------------------
Subtotal:           $${totals.subtotal.toFixed(2).padStart(8)}
${totals.discountAmount > 0 ? `Discount:          -$${totals.discountAmount.toFixed(2).padStart(8)}\n` : ''}Tax (8.5%):         $${totals.tax.toFixed(2).padStart(8)}
--------------------------------
TOTAL:              $${totals.total.toFixed(2).padStart(8)}
================================
${this.currentPaymentMethod ? `Payment: ${this.currentPaymentMethod.toUpperCase()}` : ''}

      THANK YOU!
================================
`;
        
        // Open print dialog
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Receipt ${this.transactionId}</title>
                    <style>
                        body { 
                            font-family: 'Courier New', monospace; 
                            padding: 20px; 
                            max-width: 300px; 
                            margin: 0 auto;
                            white-space: pre-wrap;
                        }
                    </style>
                </head>
                <body>${receipt}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        
        this.showToast('Receipt printed');
    }
    
    clearAll() {
        this.items = [];
        this.pluInput = '';
        this.discount = { type: null, value: 0 };
        this.currentPaymentMethod = null;
        this.transactionId = this.generateTransactionId();
        
        document.querySelectorAll('.payment-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        this.updatePLUDisplay();
        this.render();
        this.showToast('Transaction cleared');
    }
    
    showToast(message) {
        // Remove existing toast
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

// Initialize POS
const pos = new ReggieStarrPOS();
