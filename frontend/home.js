// Home Page JavaScript
class HomeManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        this.updateCollectionCount();
    }

    checkAuthentication() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = '/index.html';
            return;
        }
    }

    setupEventListeners() {
        // Search functionality
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(e.target.value);
            }
        });

        // Quick action cards
        document.querySelectorAll('.quick-action-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const href = card.getAttribute('href');
                if (href && href !== '#') {
                    window.location.href = href;
                } else {
                    this.showMessage('Funkcja w trakcie rozwoju', false);
                }
            });
        });

        // Hero action buttons
        document.querySelectorAll('.hero-actions .btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const href = btn.getAttribute('href');
                if (href) {
                    window.location.href = href;
                }
            });
        });
    }

    async updateCollectionCount() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBaseUrl}/lego/collection`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                const totalItems = data.data.collection.length;
                document.getElementById('collectionCount').textContent = totalItems;
            }
        } catch (error) {
            console.error('Error updating collection count:', error);
        }
    }

    performSearch(query) {
        if (query.trim()) {
            // For now, redirect to collection page with search
            window.location.href = `lego-collection.html?search=${encodeURIComponent(query)}`;
        }
    }

    showMessage(text, isError = false) {
        const messageContainer = document.getElementById('messageContainer');
        const message = document.getElementById('message');
        const messageText = document.getElementById('messageText');

        messageText.textContent = text;
        messageContainer.classList.remove('hidden');

        if (isError) {
            message.classList.add('error');
            message.querySelector('i').className = 'fas fa-exclamation-circle';
        } else {
            message.classList.remove('error');
            message.querySelector('i').className = 'fas fa-check-circle';
        }

        // Auto hide after 3 seconds
        setTimeout(() => {
            messageContainer.classList.add('hidden');
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HomeManager();
});
