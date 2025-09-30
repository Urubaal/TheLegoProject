// LEGO Collection Page JavaScript
class LegoCollectionManager {
    constructor() {
        this.currentTab = 'owned';
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.currentView = 'grid';
        this.filters = {
            theme: '',
            sort: 'year-desc'
        };
        this.collection = [];
        this.stats = {};
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.init();
    }

    async init() {
        const isAuthenticated = await this.checkAuthentication();
        if (isAuthenticated) {
            this.setupEventListeners();
            this.loadCollection();
            this.loadThemes();
        }
    }

    async checkAuthentication() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = '/index.html';
            return false;
        }

        // Validate token by checking profile
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                // Token is invalid or expired
                localStorage.removeItem('authToken');
                window.location.href = '/index.html';
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Token validation failed:', error);
            localStorage.removeItem('authToken');
            window.location.href = '/index.html';
            return false;
        }
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.closest('.tab-btn').dataset.tab);
            });
        });

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // Filters
        document.getElementById('themeFilter').addEventListener('change', (e) => {
            this.filters.theme = e.target.value;
            this.applyFilters();
        });

        document.getElementById('sortFilter').addEventListener('change', (e) => {
            this.filters.sort = e.target.value;
            this.applyFilters();
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.debounceSearch(e.target.value);
        });

        // Import/Export buttons
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.showExportModal();
        });

        document.getElementById('importBtn').addEventListener('click', () => {
            this.showImportModal();
        });

        // Modal close buttons
        document.getElementById('closeImportModal').addEventListener('click', () => {
            this.hideImportModal();
        });

        document.getElementById('closeExportModal').addEventListener('click', () => {
            this.hideExportModal();
        });

        // Modal cancel buttons
        document.getElementById('cancelImport').addEventListener('click', () => {
            this.hideImportModal();
        });

        document.getElementById('cancelExport').addEventListener('click', () => {
            this.hideExportModal();
        });

        // Import confirm button
        document.getElementById('confirmImport').addEventListener('click', () => {
            this.importCollection();
        });

        // Export confirm button
        document.getElementById('confirmExport').addEventListener('click', () => {
            this.exportCollection();
        });

        // File input change
        document.getElementById('csvFileInput').addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });

        // Drag and drop for file upload
        const fileUploadArea = document.getElementById('fileUploadArea');
        fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadArea.classList.add('dragover');
        });

        fileUploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            fileUploadArea.classList.remove('dragover');
        });

        fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect({ target: { files: files } });
            }
        });

        // Pagination (delegated event listener)
        document.getElementById('pagination').addEventListener('click', (e) => {
            if (e.target.classList.contains('page-btn')) {
                this.goToPage(parseInt(e.target.dataset.page));
            }
        });
    }

    async loadCollection() {
        try {
            this.showLoading(true);
            
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBaseUrl}/lego/collection?type=${this.currentTab}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                this.collection = data.data.collection;
                this.stats = data.data.stats;
                this.updateCollectionDisplay();
                this.updateStats();
                this.updateTabCounts();
            } else {
                throw new Error(data.error || 'Failed to load collection');
            }
        } catch (error) {
            console.error('Error loading collection:', error);
            this.showMessage('Błąd podczas ładowania kolekcji', true);
        } finally {
            this.showLoading(false);
        }
    }

    async loadThemes() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/lego/sets/themes`);
            const data = await response.json();
            
            if (data.success) {
                const themeFilter = document.getElementById('themeFilter');
                themeFilter.innerHTML = '<option value="">All Themes</option>' +
                    data.data.map(theme => `<option value="${theme}">${theme}</option>`).join('');
            }
        } catch (error) {
            console.error('Error loading themes:', error);
        }
    }

    updateCollectionDisplay() {
        const grid = document.getElementById('collectionGrid');
        const filteredItems = this.getFilteredItems();
        const paginatedItems = this.getPaginatedItems(filteredItems);
        
        if (paginatedItems.length === 0) {
            grid.innerHTML = this.getEmptyState();
            return;
        }

        grid.innerHTML = paginatedItems.map(item => this.createCollectionItem(item)).join('');
        this.updatePagination(filteredItems.length);
    }

    createCollectionItem(item) {
        const priceDisplay = item.paid_price 
            ? `€${item.paid_price}` 
            : (item.retail_price ? `€${item.retail_price}` : 'N/A');
        
        const conditionClass = item.condition ? `condition-${item.condition}` : '';
        
        return `
            <div class="collection-item ${conditionClass}">
                <div class="item-image">
                    <img src="${item.image_url || 'https://placehold.co/100x100/e0e0e0/666?text=No+Image'}" 
                         alt="${item.name}" 
                         onerror="this.src='https://placehold.co/100x100/e0e0e0/666?text=No+Image'">
                </div>
                
                <div class="item-info">
                    <h3 class="item-title">${item.name}</h3>
                    <p class="item-number">${item.set_number}</p>
                    <p class="item-theme">${item.theme}${item.subtheme ? ` / ${item.subtheme}` : ''}</p>
                    <p class="item-year">Year: ${item.year}</p>
                    <p class="item-pieces">${item.pieces} pieces</p>
                    ${item.minifigs ? `<p class="item-minifigs">${item.minifigs} minifigs</p>` : ''}
                    <p class="item-price">${priceDisplay}</p>
                    ${item.condition ? `<p class="item-condition">${item.condition}</p>` : ''}
                    ${item.notes ? `<p class="item-notes">${item.notes}</p>` : ''}
                </div>
                
                <div class="item-actions">
                    <button class="btn btn-sm btn-primary" onclick="collectionManager.viewSetDetails('${item.set_number}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="collectionManager.removeFromCollection('${item.set_number}', '${item.collection_type}')">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
                
                <div class="item-quantity">
                    <span class="quantity-label">Qty:</span>
                    <span class="quantity-value">${item.quantity || 1}</span>
                </div>
            </div>
        `;
    }

    getEmptyState() {
        const tabName = this.currentTab === 'owned' ? 'posiadanych' : 'pożądanych';
        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-${this.currentTab === 'owned' ? 'box' : 'heart'}"></i>
                </div>
                <h3>Brak zestawów ${tabName}</h3>
                <p>Nie masz jeszcze żadnych zestawów w tej kategorii.</p>
                <button class="btn btn-primary" onclick="collectionManager.browseSets()">
                    <i class="fas fa-search"></i> Przeglądaj zestawy
                </button>
            </div>
        `;
    }

    getFilteredItems() {
        let filtered = [...this.collection];

        // Apply theme filter
        if (this.filters.theme) {
            filtered = filtered.filter(item => 
                item.theme && item.theme.toLowerCase().includes(this.filters.theme.toLowerCase())
            );
        }

        // Apply sorting
        const [sortField, sortOrder] = this.filters.sort.split('-');
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortField) {
                case 'year':
                    aValue = a.year || 0;
                    bValue = b.year || 0;
                    break;
                case 'name':
                    aValue = a.name || '';
                    bValue = b.name || '';
                    break;
                case 'price':
                    aValue = a.paid_price || a.retail_price || 0;
                    bValue = b.paid_price || b.retail_price || 0;
                    break;
                default:
                    aValue = a.set_number || '';
                    bValue = b.set_number || '';
            }

            if (sortOrder === 'desc') {
                return bValue > aValue ? 1 : -1;
            } else {
                return aValue > bValue ? 1 : -1;
            }
        });

        return filtered;
    }

    getPaginatedItems(items) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return items.slice(startIndex, endIndex);
    }

    updatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `<button class="btn page-btn" data-page="${this.currentPage - 1}">Previous</button>`;
        }
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<button class="btn btn-primary page-btn" data-page="${i}">${i}</button>`;
            } else if (i === 1 || i === totalPages || Math.abs(i - this.currentPage) <= 2) {
                paginationHTML += `<button class="btn page-btn" data-page="${i}">${i}</button>`;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }
        
        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `<button class="btn page-btn" data-page="${this.currentPage + 1}">Next</button>`;
        }
        
        pagination.innerHTML = paginationHTML;
    }

    updateStats() {
        document.getElementById('totalSets').textContent = this.stats.owned_sets || 0;
        document.getElementById('totalValue').textContent = `€${parseFloat(this.stats.total_paid_value || 0).toFixed(2)}`;
        document.getElementById('avgPrice').textContent = `€${parseFloat(this.stats.avg_paid_price || 0).toFixed(2)}`;
        
        // Calculate growth (mock data for now)
        const growth = Math.random() * 20 - 5; // Random growth between -5% and 15%
        document.getElementById('growth').textContent = `${growth.toFixed(1)}%`;
        document.getElementById('growth').style.color = growth >= 0 ? '#4caf50' : '#f44336';
    }

    updateTabCounts() {
        // This would need to be updated with actual counts from the API
        const ownedCount = this.stats.owned_sets || 0;
        const wantedCount = this.stats.wanted_sets || 0;
        
        document.getElementById('ownedCount').textContent = ownedCount;
        document.getElementById('wantedCount').textContent = wantedCount;
        document.getElementById('collectionCount').textContent = ownedCount + wantedCount;
    }

    switchTab(tab) {
        this.currentTab = tab;
        this.currentPage = 1;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Update breadcrumb
        document.getElementById('currentTab').textContent = tab === 'owned' ? 'Owned' : 'Wanted';
        
        // Reload collection
        this.loadCollection();
    }

    switchView(view) {
        this.currentView = view;
        
        // Update view buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        // Update grid class
        const grid = document.getElementById('collectionGrid');
        grid.className = `collection-grid ${view === 'list' ? 'list-view' : 'grid-view'}`;
    }

    applyFilters() {
        this.currentPage = 1;
        this.updateCollectionDisplay();
    }

    debounceSearch(query) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }

    performSearch(query) {
        if (query.trim()) {
            // For now, just filter the current collection
            // In a real app, this would make an API call
            const filtered = this.collection.filter(item => 
                item.name.toLowerCase().includes(query.toLowerCase()) ||
                item.set_number.toLowerCase().includes(query.toLowerCase()) ||
                (item.theme && item.theme.toLowerCase().includes(query.toLowerCase()))
            );
            
            // Temporarily replace collection with search results
            const originalCollection = this.collection;
            this.collection = filtered;
            this.updateCollectionDisplay();
            
            // Restore original collection after a delay
            setTimeout(() => {
                this.collection = originalCollection;
            }, 10000);
        } else {
            this.updateCollectionDisplay();
        }
    }

    goToPage(page) {
        this.currentPage = page;
        this.updateCollectionDisplay();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    viewSetDetails(setNumber) {
        window.location.href = `set-detail.html?set=${setNumber}`;
    }

    async removeFromCollection(setNumber, collectionType) {
        if (!confirm(`Czy na pewno chcesz usunąć ten zestaw z kolekcji?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBaseUrl}/lego/collection/${setNumber}/${collectionType}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                this.showMessage('Zestaw został usunięty z kolekcji', false);
                this.loadCollection(); // Reload collection
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error removing from collection:', error);
            this.showMessage('Błąd podczas usuwania z kolekcji', true);
        }
    }

    browseSets() {
        // This would navigate to a browse page
        window.location.href = 'browse-sets.html';
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

    // Import/Export Modal Functions
    showImportModal() {
        document.getElementById('importModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    hideImportModal() {
        document.getElementById('importModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.resetImportForm();
    }

    showExportModal() {
        document.getElementById('exportModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    hideExportModal() {
        document.getElementById('exportModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    resetImportForm() {
        document.getElementById('csvFileInput').value = '';
        document.getElementById('fileInfo').style.display = 'none';
        document.getElementById('confirmImport').disabled = true;
        document.getElementById('overwriteExisting').checked = false;
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.showMessage('Proszę wybrać plik CSV', true);
            return;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            this.showMessage('Plik jest za duży. Maksymalny rozmiar to 10MB', true);
            return;
        }

        // Show file info
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = this.formatFileSize(file.size);
        document.getElementById('fileInfo').style.display = 'block';
        document.getElementById('confirmImport').disabled = false;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async importCollection() {
        const fileInput = document.getElementById('csvFileInput');
        const file = fileInput.files[0];
        const overwrite = document.getElementById('overwriteExisting').checked;

        if (!file) {
            this.showMessage('Proszę wybrać plik CSV', true);
            return;
        }

        this.showLoading(true);
        document.getElementById('confirmImport').disabled = true;

        try {
            const formData = new FormData();
            formData.append('csvFile', file);
            formData.append('overwrite', overwrite);

            const response = await fetch(`${this.apiBaseUrl}/lego/collection/import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage(result.message);
                this.hideImportModal();
                this.loadCollection(); // Refresh collection
            } else {
                this.showMessage(result.error || 'Błąd podczas importu', true);
            }
        } catch (error) {
            console.error('Import error:', error);
            this.showMessage('Błąd podczas importu kolekcji', true);
        } finally {
            this.showLoading(false);
            document.getElementById('confirmImport').disabled = false;
        }
    }

    async exportCollection() {
        const exportType = document.querySelector('input[name="exportType"]:checked').value;
        
        this.showLoading(true);
        document.getElementById('confirmExport').disabled = true;

        try {
            const response = await fetch(`${this.apiBaseUrl}/lego/collection/export?type=${exportType}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                // Get filename from Content-Disposition header
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = `lego-collection-${exportType}-${new Date().toISOString().split('T')[0]}.csv`;
                
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                    if (filenameMatch) {
                        filename = filenameMatch[1];
                    }
                }

                // Create blob and download
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                this.showMessage('Kolekcja została wyeksportowana pomyślnie');
                this.hideExportModal();
            } else {
                const result = await response.json();
                this.showMessage(result.error || 'Błąd podczas eksportu', true);
            }
        } catch (error) {
            console.error('Export error:', error);
            this.showMessage('Błąd podczas eksportu kolekcji', true);
        } finally {
            this.showLoading(false);
            document.getElementById('confirmExport').disabled = false;
        }
    }
}

// Initialize the application when DOM is loaded
let collectionManager;
document.addEventListener('DOMContentLoaded', () => {
    collectionManager = new LegoCollectionManager();
});
