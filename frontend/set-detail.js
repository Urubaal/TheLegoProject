// Set Detail Page JavaScript
class SetDetailManager {
    constructor() {
        this.currentSetNumber = null;
        this.currentSet = null;
        this.userCollection = {
            owned: null,
            wanted: null
        };
        this.isAuthenticated = false;
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        this.loadSetData();
    }

    checkAuthentication() {
        const token = localStorage.getItem('authToken');
        // Allow viewing set details without authentication
        // Authentication is only needed for collection management
        this.isAuthenticated = !!token;
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Collection checkboxes
        document.getElementById('ownedCheckbox').addEventListener('change', (e) => {
            this.handleCollectionChange('owned', e.target.checked);
        });

        document.getElementById('wantedCheckbox').addEventListener('change', (e) => {
            this.handleCollectionChange('wanted', e.target.checked);
        });

        // Remove buttons
        document.getElementById('removeOwnedBtn').addEventListener('click', () => {
            this.removeFromCollection('owned');
        });

        document.getElementById('removeWantedBtn').addEventListener('click', () => {
            this.removeFromCollection('wanted');
        });

        // Collection details inputs
        document.getElementById('ownedQuantity').addEventListener('change', (e) => {
            this.updateCollectionDetails('owned', { quantity: parseInt(e.target.value) });
        });

        document.getElementById('paidPrice').addEventListener('change', (e) => {
            this.updateCollectionDetails('owned', { paidPrice: parseFloat(e.target.value) });
        });

        document.getElementById('condition').addEventListener('change', (e) => {
            this.updateCollectionDetails('owned', { condition: e.target.value });
        });

        document.getElementById('notes').addEventListener('change', (e) => {
            this.updateCollectionDetails('owned', { notes: e.target.value });
        });

        // Gallery thumbnails
        document.querySelectorAll('.thumbnail').forEach((thumb, index) => {
            thumb.addEventListener('click', () => this.switchGalleryImage(index));
        });

        // Search functionality
        document.querySelector('.search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(e.target.value);
            }
        });

        // Buy buttons
        document.querySelectorAll('.buy-option .btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const storeName = e.target.closest('.buy-option').querySelector('.store-name').textContent;
                this.handleBuyClick(storeName);
            });
        });
    }

    async loadSetData() {
        try {
            this.showLoading(true);
            
            // Get set number from URL or use default
            const urlParams = new URLSearchParams(window.location.search);
            const setNumber = urlParams.get('set') || '75399-1';
            this.currentSetNumber = setNumber;

            // Load set details and offers
            const loadPromises = [
                this.loadSetDetails(setNumber),
                this.loadOffers(setNumber)
            ];
            
            // Only load user collection if authenticated
            if (this.isAuthenticated) {
                loadPromises.push(this.loadUserCollection(setNumber));
            }
            
            await Promise.all(loadPromises);

            this.updateCollectionCount();
            this.updateUIForAuthentication();
            this.showLoading(false);
        } catch (error) {
            console.error('Error loading set data:', error);
            this.showMessage('Błąd podczas ładowania danych zestawu', true);
            this.showLoading(false);
        }
    }

    async loadSetDetails(setNumber) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/lego/sets/${setNumber}`);
            const data = await response.json();

            if (data.success) {
                this.currentSet = data.data.set;
                this.updateSetDisplay();
            } else {
                throw new Error(data.error || 'Nie udało się załadować szczegółów zestawu');
            }
        } catch (error) {
            console.error('Error loading set details:', error);
            throw error;
        }
    }

    async loadOffers(setNumber) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/lego/sets/${setNumber}/offers?activeOnly=true&limit=10&sortBy=price&sortOrder=ASC`);
            const data = await response.json();

            if (data.success) {
                this.updateOffersDisplay(data.data.offers, data.data.priceStats);
            }
        } catch (error) {
            console.error('Error loading offers:', error);
            // Don't throw error for offers, just log it
        }
    }

    async loadUserCollection(setNumber) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBaseUrl}/lego/collection`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (data.success) {
                // Find owned and wanted items for this set
                const owned = data.data.collection.find(item => 
                    item.set_number === setNumber && item.collection_type === 'owned'
                );
                const wanted = data.data.collection.find(item => 
                    item.set_number === setNumber && item.collection_type === 'wanted'
                );

                this.userCollection.owned = owned;
                this.userCollection.wanted = wanted;
                this.updateCollectionDisplay();
            }
        } catch (error) {
            console.error('Error loading user collection:', error);
            // Don't throw error for collection, just log it
        }
    }

    updateSetDisplay() {
        if (!this.currentSet) return;

        // Update page title
        document.title = `${this.currentSet.set_number} ${this.currentSet.name} - BrickEconomy Clone`;

        // Update breadcrumbs
        document.getElementById('themeBreadcrumb').textContent = this.currentSet.theme;
        document.getElementById('subthemeBreadcrumb').textContent = this.currentSet.subtheme;
        document.getElementById('setNameBreadcrumb').textContent = this.currentSet.name;

        // Update set details
        document.getElementById('setTitle').textContent = `${this.currentSet.set_number} LEGO ${this.currentSet.theme} ${this.currentSet.name}`;
        document.getElementById('setImage').src = this.currentSet.image_url || 'https://via.placeholder.com/200x200?text=No+Image';
        document.getElementById('setDescription').textContent = this.currentSet.description || 'No description available.';

        // Update set details card
        document.getElementById('setNumber').textContent = this.currentSet.set_number;
        document.getElementById('setName').textContent = this.currentSet.name;
        document.getElementById('setTheme').textContent = this.currentSet.theme;
        document.getElementById('setSubtheme').textContent = this.currentSet.subtheme;
        document.getElementById('setYear').textContent = this.currentSet.year;
        document.getElementById('setPieces').textContent = this.currentSet.pieces;
        document.getElementById('setMinifigs').textContent = this.currentSet.minifigs;
        document.getElementById('setAvailability').textContent = this.currentSet.availability;

        // Update theme and subtheme links
        document.getElementById('setTheme').href = `#theme=${this.currentSet.theme}`;
        document.getElementById('setSubtheme').href = `#subtheme=${this.currentSet.subtheme}`;
    }

    updateOffersDisplay(offers, priceStats) {
        const offersList = document.getElementById('offersList');
        
        if (!offers || offers.length === 0) {
            offersList.innerHTML = '<p class="no-offers">Brak dostępnych ofert</p>';
            return;
        }

        offersList.innerHTML = offers.map(offer => `
            <div class="offer-item">
                <div class="offer-logo">${this.getStoreLogo(offer.title)}</div>
                <div class="offer-details">
                    <div class="offer-title">${offer.title}</div>
                    <div class="offer-location">(${offer.location})</div>
                    <div class="offer-condition">${offer.condition}</div>
                </div>
                <div class="offer-price-section">
                    <div class="offer-price">€${offer.price}</div>
                    ${offer.retail_price ? `<div class="offer-discount">-${Math.round((1 - offer.price / offer.retail_price) * 100)}%</div>` : ''}
                </div>
            </div>
        `).join('');

        // Update price statistics if available
        if (priceStats) {
            this.updatePriceStats(priceStats);
        }
    }

    getStoreLogo(title) {
        if (title.toLowerCase().includes('olx')) return 'O';
        if (title.toLowerCase().includes('allegro')) return 'A';
        if (title.toLowerCase().includes('ebay')) return 'E';
        if (title.toLowerCase().includes('amazon')) return 'A';
        return 'S';
    }

    updatePriceStats(priceStats) {
        // Update price range display
        if (priceStats.min_price && priceStats.max_price) {
            const minPrice = document.querySelector('.price-label:first-child');
            const maxPrice = document.querySelector('.price-label:last-child');
            if (minPrice) minPrice.textContent = `€${priceStats.min_price}`;
            if (maxPrice) maxPrice.textContent = `€${priceStats.max_price}`;
        }
    }

    updateCollectionDisplay() {
        const ownedCheckbox = document.getElementById('ownedCheckbox');
        const wantedCheckbox = document.getElementById('wantedCheckbox');
        const ownedQuantity = document.getElementById('ownedQuantity');
        const collectionDetails = document.getElementById('collectionDetails');
        const removeOwnedBtn = document.getElementById('removeOwnedBtn');
        const removeWantedBtn = document.getElementById('removeWantedBtn');

        // Update owned checkbox
        if (this.userCollection.owned) {
            ownedCheckbox.checked = true;
            ownedQuantity.value = this.userCollection.owned.quantity || 1;
            document.getElementById('paidPrice').value = this.userCollection.owned.paid_price || '';
            document.getElementById('condition').value = this.userCollection.owned.condition || 'new';
            document.getElementById('notes').value = this.userCollection.owned.notes || '';
            collectionDetails.style.display = 'block';
            removeOwnedBtn.style.display = 'block';
        } else {
            ownedCheckbox.checked = false;
            ownedQuantity.value = 1;
            collectionDetails.style.display = 'none';
            removeOwnedBtn.style.display = 'none';
        }

        // Update wanted checkbox
        if (this.userCollection.wanted) {
            wantedCheckbox.checked = true;
            removeWantedBtn.style.display = 'block';
        } else {
            wantedCheckbox.checked = false;
            removeWantedBtn.style.display = 'none';
        }
    }

    async handleCollectionChange(type, isChecked) {
        if (!this.isAuthenticated) {
            this.showMessage('Musisz się zalogować, aby zarządzać kolekcją', true);
            // Uncheck the checkbox
            document.getElementById(type + 'Checkbox').checked = false;
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            
            if (isChecked) {
                // Add to collection
                const response = await fetch(`${this.apiBaseUrl}/lego/collection/add`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        setNumber: this.currentSetNumber,
                        collectionType: type,
                        quantity: type === 'owned' ? 1 : undefined
                    })
                });

                const data = await response.json();
                if (data.success) {
                    this.userCollection[type] = data.data;
                    this.updateCollectionDisplay();
                    this.updateCollectionCount();
                    this.showMessage(`Zestaw został dodany do kolekcji jako ${type === 'owned' ? 'posiadany' : 'pożądany'}`, false);
                } else {
                    throw new Error(data.error);
                }
            } else {
                // Remove from collection
                await this.removeFromCollection(type);
            }
        } catch (error) {
            console.error('Error updating collection:', error);
            this.showMessage('Błąd podczas aktualizacji kolekcji', true);
            // Revert checkbox state
            document.getElementById(`${type}Checkbox`).checked = !isChecked;
        }
    }

    async removeFromCollection(type) {
        if (!this.isAuthenticated) {
            this.showMessage('Musisz się zalogować, aby zarządzać kolekcją', true);
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBaseUrl}/lego/collection/${this.currentSetNumber}/${type}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                this.userCollection[type] = null;
                document.getElementById(`${type}Checkbox`).checked = false;
                this.updateCollectionDisplay();
                this.updateCollectionCount();
                this.showMessage('Element został usunięty z kolekcji', false);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error removing from collection:', error);
            this.showMessage('Błąd podczas usuwania z kolekcji', true);
        }
    }

    async updateCollectionDetails(type, details) {
        if (!this.userCollection[type]) return;

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBaseUrl}/lego/collection/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    setNumber: this.currentSetNumber,
                    collectionType: type,
                    ...details
                })
            });

            const data = await response.json();
            if (data.success) {
                this.userCollection[type] = { ...this.userCollection[type], ...details };
            }
        } catch (error) {
            console.error('Error updating collection details:', error);
        }
    }

    updateUIForAuthentication() {
        const collectionCard = document.querySelector('.collection-card');
        const collectionLink = document.querySelector('.collection-link');
        
        if (!this.isAuthenticated) {
            // Hide collection card for non-authenticated users
            if (collectionCard) {
                collectionCard.style.display = 'none';
            }
            // Hide collection count
            const countElement = document.getElementById('collectionCount');
            if (countElement) {
                countElement.style.display = 'none';
            }
        } else {
            // Show collection card for authenticated users
            if (collectionCard) {
                collectionCard.style.display = 'block';
            }
            // Show collection count
            const countElement = document.getElementById('collectionCount');
            if (countElement) {
                countElement.style.display = 'inline-block';
            }
        }
    }

    async updateCollectionCount() {
        if (!this.isAuthenticated) {
            return;
        }

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

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    switchGalleryImage(index) {
        // Update gallery items
        document.querySelectorAll('.gallery-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });

        // Update thumbnails
        document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
    }

    performSearch(query) {
        if (query.trim()) {
            window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        }
    }

    handleBuyClick(storeName) {
        // This would typically redirect to the store or open a modal
        this.showMessage(`Redirecting to ${storeName}...`, false);
        // For demo purposes, just show a message
        setTimeout(() => {
            this.showMessage(`This would redirect to ${storeName}`, false);
        }, 1000);
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
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

        // Auto hide after 5 seconds
        setTimeout(() => {
            messageContainer.classList.add('hidden');
        }, 5000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SetDetailManager();
});
