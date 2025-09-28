// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// ⚠️ WAŻNE: Przy dodawaniu nowych pól do formularzy ZAWSZE sprawdź:
// 1. Czy baza danych ma odpowiednie kolumny (lego_database_schema.sql)
// 2. Czy backend obsługuje nowe pola (ProfileService, UserCollection)
// 3. Czy constraints są aktualne (np. condition_status)
// 4. Uruchom migracje jeśli potrzeba
// Patrz: DEVELOPMENT_RULES.md

// Global state
let currentUser = null;
let collectionData = {
    owned_sets: [],
    wanted_sets: [],
    owned_minifigs: [],
    wanted_minifigs: []
};

// Pagination state
const pagination = {
    currentPage: 1,
    itemsPerPage: 12,
    totalItems: 0
};

// API Cache system
const apiCache = {
    cache: new Map(),
    maxAge: 5 * 60 * 1000, // 5 minutes
    
    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    },
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.maxAge) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    },
    
    clear() {
        this.cache.clear();
    }
};

// DOM Elements
const navLinks = document.querySelectorAll('.nav-link[data-section]');
const contentSections = document.querySelectorAll('.content-section');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

// Modals
const editProfileModal = document.getElementById('editProfileModal');
const addSetModal = document.getElementById('addSetModal');
const addWantedSetModal = document.getElementById('addWantedSetModal');

// Forms
const editProfileForm = document.getElementById('editProfileForm');
const addSetForm = document.getElementById('addSetForm');
const addWantedSetForm = document.getElementById('addWantedSetForm');

// Buttons
const editProfileBtn = document.getElementById('editProfileBtn');
const addSetBtn = document.getElementById('addSetBtn');
const addWantedSetBtn = document.getElementById('addWantedSetBtn');
const addMinifigBtn = document.getElementById('addMinifigBtn');
const addWantedMinifigBtn = document.getElementById('addWantedMinifigBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Search buttons
const searchSetBtn = document.getElementById('searchSetBtn');
const searchWantedSetBtn = document.getElementById('searchWantedSetBtn');

class DashboardManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuth();
        this.initNotifications();
    }

    setupEventListeners() {
        // Navigation
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Tabs
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTabChange(e));
        });

        // Buttons
        editProfileBtn.addEventListener('click', () => this.showEditProfileModal());
        addSetBtn.addEventListener('click', () => this.showAddSetModal());
        addWantedSetBtn.addEventListener('click', () => this.showAddWantedSetModal());
        addMinifigBtn.addEventListener('click', () => this.showAddMinifigModal());
        addWantedMinifigBtn.addEventListener('click', () => this.showAddWantedMinifigModal());
        logoutBtn.addEventListener('click', () => this.handleLogout());

        // Search buttons
        searchSetBtn.addEventListener('click', () => this.searchSet('set'));
        searchWantedSetBtn.addEventListener('click', () => this.searchSet('wanted'));

        // Auto-search on set number input
        const setNumberInput = document.getElementById('setNumber');
        if (setNumberInput) {
            setNumberInput.addEventListener('input', (e) => {
                const value = e.target.value.trim();
                if (value.length >= 4) { // Search when at least 4 characters
                    this.autoSearchSet(value);
                }
            });
        }

        // Forms
        editProfileForm.addEventListener('submit', (e) => this.handleEditProfile(e));
        addSetForm.addEventListener('submit', (e) => this.handleAddSet(e));
        addWantedSetForm.addEventListener('submit', (e) => this.handleAddWantedSet(e));

        // Modal close buttons
        this.setupModalCloseButtons();
    }

    setupModalCloseButtons() {
        const closeButtons = [
            { btn: document.getElementById('closeEditProfileModal'), modal: editProfileModal },
            { btn: document.getElementById('closeAddSetModal'), modal: addSetModal },
            { btn: document.getElementById('closeAddWantedSetModal'), modal: addWantedSetModal }
        ];

        closeButtons.forEach(({ btn, modal }) => {
            btn.addEventListener('click', () => this.closeModal(modal));
        });

        // Close on cancel buttons
        document.getElementById('cancelEditProfile').addEventListener('click', () => this.closeModal(editProfileModal));
        document.getElementById('cancelAddSet').addEventListener('click', () => this.closeModal(addSetModal));
        document.getElementById('cancelAddWantedSet').addEventListener('click', () => this.closeModal(addWantedSetModal));

        // Close on outside click
        [editProfileModal, addSetModal, addWantedSetModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });
    }

    async checkAuth() {
        const token = localStorage.getItem('authToken');
        console.log('Checking auth with token:', token ? 'exists' : 'missing');
        if (!token) {
            console.log('No token found, redirecting to login');
            window.location.href = '/index.html';
            return;
        }

        try {
            console.log('Making profile request to:', `${API_BASE_URL}/profile`);
            const response = await fetch(`${API_BASE_URL}/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Profile response status:', response.status);
            if (!response.ok) {
                throw new Error(`Unauthorized: ${response.status}`);
            }

            const data = await response.json();
            console.log('Profile response data:', data);
            currentUser = data.data.user;
            this.updateProfileDisplay();
            this.loadCollectionData();
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('authToken');
            window.location.href = '/index.html';
        }
    }

    updateProfileDisplay() {
        if (!currentUser) return;

        // Username na górze jako główna nazwa
        document.getElementById('profileName').textContent = currentUser.username || 'Brak username';
        
        // Pełna nazwa (display_name) na dole
        const displayName = currentUser.name || currentUser.display_name || 'Brak nazwy';
        document.getElementById('profileUsername').textContent = displayName;
        
        document.getElementById('profileEmail').textContent = currentUser.email;
        document.getElementById('profileCountry').textContent = `Kraj: ${currentUser.country || 'Nie ustawiono'}`;
        
        // Poprawne formatowanie daty
        let memberSinceText = 'Brak daty';
        if (currentUser.created_at) {
            try {
                const date = new Date(currentUser.created_at);
                if (!isNaN(date.getTime())) {
                    memberSinceText = `Członek od: ${date.toLocaleDateString('pl-PL')}`;
                }
            } catch (error) {
                console.error('Error formatting date:', error);
            }
        }
        document.getElementById('profileMemberSince').textContent = memberSinceText;
    }

    async loadCollectionData() {
        const cacheKey = 'collection_data';
        
        // Check cache first
        const cachedData = apiCache.get(cacheKey);
        if (cachedData) {
            collectionData = cachedData;
            this.updateCollectionStats();
            this.renderCollection();
            return;
        }
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/profile/collection`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                collectionData = data;
                
                // Cache the data
                apiCache.set(cacheKey, data);
                
                this.updateCollectionStats();
                this.renderCollection();
            }
        } catch (error) {
            console.error('Error loading collection:', error);
            this.showMessage('Błąd podczas ładowania kolekcji. Sprawdź połączenie internetowe.', true);
        }
    }

    updateCollectionStats() {
        const stats = {
            owned_sets: collectionData.owned_sets?.length || 0,
            wanted_sets: collectionData.wanted_sets?.length || 0,
            total_pieces: collectionData.owned_sets?.reduce((sum, set) => sum + (set.pieces || 0), 0) || 0,
            total_minifigs: collectionData.owned_sets?.reduce((sum, set) => sum + (set.minifigures || 0), 0) || 0
        };

        document.getElementById('ownedSetsCount').textContent = stats.owned_sets;
        document.getElementById('wantedSetsCount').textContent = stats.wanted_sets;
        document.getElementById('totalPieces').textContent = stats.total_pieces.toLocaleString();
        document.getElementById('totalMinifigs').textContent = stats.total_minifigs;
    }

    renderCollection() {
        this.renderOwnedSets();
        this.renderWantedSets();
        this.renderOwnedMinifigs();
        this.renderWantedMinifigs();
    }

    renderOwnedSets() {
        const grid = document.getElementById('ownedSetsGrid');
        if (!grid) return;

        if (collectionData.owned_sets?.length === 0) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-boxes"></i><p>Brak zestawów w kolekcji</p></div>';
            return;
        }

        const sets = collectionData.owned_sets;
        pagination.totalItems = sets.length;
        const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
        const endIndex = startIndex + pagination.itemsPerPage;
        const paginatedSets = sets.slice(startIndex, endIndex);

        grid.innerHTML = paginatedSets.map(set => {
            const conditionText = {
                'factory_sealed': 'Zapakowany fabrycznie',
                'new': 'Nowy',
                'used': 'Używany'
            }[set.condition_status] || 'Nieznany';
            
            const components = [];
            if (set.has_minifigures) components.push('Figurki');
            if (set.has_instructions) components.push('Instrukcje');
            if (set.has_box) components.push('Pudełko');
            if (set.has_building_blocks) components.push('Klocki');
            
            return `
                <div class="collection-item">
                    <div class="item-image">
                        <img data-src="https://via.placeholder.com/150x150/007ACC/FFFFFF?text=${encodeURIComponent(set.set_name.substring(0, 10))}" 
                             alt="${set.set_name}" 
                             class="lazy-image"
                             loading="lazy">
                        <i class="fas fa-cube placeholder-icon"></i>
                    </div>
                    <div class="item-info">
                        <h3>${set.set_name}</h3>
                        <p class="item-number">#${set.set_number}</p>
                        <p class="item-condition">Stan: ${conditionText}</p>
                        ${set.purchase_date ? `<p class="item-date">Data zakupu: ${new Date(set.purchase_date).toLocaleDateString('pl-PL')}</p>` : ''}
                        ${set.purchase_price ? `<p class="item-price">Cena: ${set.purchase_price} ${set.purchase_currency || 'PLN'}</p>` : ''}
                        ${components.length > 0 ? `<p class="item-components">Komponenty: ${components.join(', ')}</p>` : ''}
                        ${set.notes ? `<p class="item-notes">${set.notes}</p>` : ''}
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-sm btn-secondary" onclick="dashboardManager.editItem('owned-set', '${set.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="dashboardManager.deleteItem('owned-set', '${set.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Initialize lazy loading for this batch
        this.initLazyLoading();

        this.renderPagination('ownedSetsGrid');
    }

    renderPagination(gridId) {
        const grid = document.getElementById(gridId);
        if (!grid || pagination.totalItems <= pagination.itemsPerPage) return;

        const totalPages = Math.ceil(pagination.totalItems / pagination.itemsPerPage);
        const paginationId = `${gridId}_pagination`;
        
        // Remove existing pagination
        const existingPagination = document.getElementById(paginationId);
        if (existingPagination) {
            existingPagination.remove();
        }

        let paginationHTML = '<div class="pagination" id="' + paginationId + '">';
        
        // Previous button
        if (pagination.currentPage > 1) {
            paginationHTML += `<button class="btn btn-sm btn-secondary" onclick="dashboardManager.changePage(${pagination.currentPage - 1})">
                <i class="fas fa-chevron-left"></i> Poprzednia
            </button>`;
        }
        
        // Page numbers
        const startPage = Math.max(1, pagination.currentPage - 2);
        const endPage = Math.min(totalPages, pagination.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === pagination.currentPage ? 'btn-primary' : 'btn-secondary';
            paginationHTML += `<button class="btn btn-sm ${activeClass}" onclick="dashboardManager.changePage(${i})">${i}</button>`;
        }
        
        // Next button
        if (pagination.currentPage < totalPages) {
            paginationHTML += `<button class="btn btn-sm btn-secondary" onclick="dashboardManager.changePage(${pagination.currentPage + 1})">
                Następna <i class="fas fa-chevron-right"></i>
            </button>`;
        }
        
        paginationHTML += '</div>';
        
        // Insert pagination after grid
        grid.insertAdjacentHTML('afterend', paginationHTML);
    }

    changePage(page) {
        pagination.currentPage = page;
        this.renderCollection();
    }

    initLazyLoading() {
        const lazyImages = document.querySelectorAll('.lazy-image');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy-image');
                        img.classList.add('loaded');
                        
                        // Hide placeholder icon
                        const placeholderIcon = img.parentElement.querySelector('.placeholder-icon');
                        if (placeholderIcon) {
                            placeholderIcon.style.display = 'none';
                        }
                        
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            lazyImages.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for browsers without IntersectionObserver
            lazyImages.forEach(img => {
                img.src = img.dataset.src;
                img.classList.remove('lazy-image');
                img.classList.add('loaded');
                
                const placeholderIcon = img.parentElement.querySelector('.placeholder-icon');
                if (placeholderIcon) {
                    placeholderIcon.style.display = 'none';
                }
            });
        }
    }

    previewImage(input) {
        const preview = document.getElementById('editPhotoPreview');
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Podgląd" style="max-width: 200px; max-height: 200px; border-radius: 8px; margin-top: 10px;">
                    <p style="margin-top: 5px; font-size: 12px; color: #666;">Podgląd zdjęcia</p>
                `;
            };
            
            reader.readAsDataURL(input.files[0]);
        }
    }

    async uploadImage(file, itemId, type) {
        try {
            const token = localStorage.getItem('authToken');
            const formData = new FormData();
            formData.append('photo', file);
            
            const response = await fetch(`${API_BASE_URL}/profile/collection/${type}/${itemId}/photo`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                this.showMessage('Zdjęcie zostało przesłane pomyślnie!', false);
                return result.photo_url;
            } else {
                const error = await response.json();
                this.showMessage(error.error || 'Błąd przesyłania zdjęcia', true);
                return null;
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showMessage('Błąd przesyłania zdjęcia', true);
            return null;
        }
    }

    renderWantedSets() {
        const grid = document.getElementById('wantedSetsGrid');
        if (!grid) return;

        if (collectionData.wanted_sets?.length === 0) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-heart"></i><p>Brak zestawów na liście życzeń</p></div>';
            return;
        }

        grid.innerHTML = collectionData.wanted_sets.map(set => `
            <div class="collection-item">
                <div class="item-image">
                    <i class="fas fa-heart"></i>
                </div>
                <div class="item-info">
                    <h3>${set.set_name}</h3>
                    <p class="item-number">#${set.set_number}</p>
                    <p class="item-priority">Priorytet: ${set.priority}</p>
                    ${set.max_price ? `<p class="item-price">Max cena: ${set.max_price} ${set.max_currency || 'PLN'}</p>` : ''}
                    ${set.notes ? `<p class="item-notes">${set.notes}</p>` : ''}
                </div>
                <div class="item-actions">
                    <button class="btn btn-sm btn-secondary" onclick="dashboardManager.editItem('wanted-set', '${set.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="dashboardManager.deleteItem('wanted-set', '${set.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderOwnedMinifigs() {
        const grid = document.getElementById('ownedMinifigsGrid');
        if (!grid) return;

        if (collectionData.owned_minifigs?.length === 0) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-user-friends"></i><p>Brak minifigurek w kolekcji</p></div>';
            return;
        }

        grid.innerHTML = collectionData.owned_minifigs.map(minifig => `
            <div class="collection-item">
                <div class="item-image">
                    <i class="fas fa-user-friends"></i>
                </div>
                <div class="item-info">
                    <h3>${minifig.minifig_name}</h3>
                    ${minifig.minifig_number ? `<p class="item-number">#${minifig.minifig_number}</p>` : ''}
                    <p class="item-condition">Stan: ${minifig.condition_status === 'new' ? 'Nowa' : 'Używana'}</p>
                    ${minifig.purchase_price ? `<p class="item-price">Cena: ${minifig.purchase_price} ${minifig.purchase_currency || 'PLN'}</p>` : ''}
                    ${minifig.notes ? `<p class="item-notes">${minifig.notes}</p>` : ''}
                </div>
                <div class="item-actions">
                    <button class="btn btn-sm btn-secondary" onclick="dashboardManager.editItem('owned-minifig', '${minifig.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="dashboardManager.deleteItem('owned-minifig', '${minifig.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderWantedMinifigs() {
        const grid = document.getElementById('wantedMinifigsGrid');
        if (!grid) return;

        if (collectionData.wanted_minifigs?.length === 0) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-heart"></i><p>Brak minifigurek na liście życzeń</p></div>';
            return;
        }

        grid.innerHTML = collectionData.wanted_minifigs.map(minifig => `
            <div class="collection-item">
                <div class="item-image">
                    <i class="fas fa-heart"></i>
                </div>
                <div class="item-info">
                    <h3>${minifig.minifig_name}</h3>
                    ${minifig.minifig_number ? `<p class="item-number">#${minifig.minifig_number}</p>` : ''}
                    <p class="item-priority">Priorytet: ${minifig.priority}</p>
                    ${minifig.max_price ? `<p class="item-price">Max cena: ${minifig.max_price} ${minifig.max_currency || 'PLN'}</p>` : ''}
                    ${minifig.notes ? `<p class="item-notes">${minifig.notes}</p>` : ''}
                </div>
                <div class="item-actions">
                    <button class="btn btn-sm btn-secondary" onclick="dashboardManager.editItem('wanted-minifig', '${minifig.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="dashboardManager.deleteItem('wanted-minifig', '${minifig.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    handleNavigation(e) {
        e.preventDefault();
        const section = e.currentTarget.dataset.section;

        // Update active nav link
        navLinks.forEach(link => link.classList.remove('active'));
        e.currentTarget.classList.add('active');

        // Show corresponding section
        contentSections.forEach(section => section.classList.remove('active'));
        document.getElementById(`${section}-section`).classList.add('active');
    }

    handleTabChange(e) {
        const tab = e.currentTarget.dataset.tab;

        // Update active tab button
        tabBtns.forEach(btn => btn.classList.remove('active'));
        e.currentTarget.classList.add('active');

        // Show corresponding tab panel
        tabPanels.forEach(panel => panel.classList.remove('active'));
        document.getElementById(`${tab}-tab`).classList.add('active');
    }

    showEditProfileModal() {
        if (!currentUser) return;

        document.getElementById('editName').value = currentUser.name || '';
        document.getElementById('editUsername').value = currentUser.username || '';
        document.getElementById('editCountry').value = currentUser.country || '';
        
        editProfileModal.classList.add('active');
    }

    showAddSetModal() {
        addSetModal.classList.add('active');
    }

    showAddWantedSetModal() {
        addWantedSetModal.classList.add('active');
    }

    showAddMinifigModal() {
        // TODO: Implement minifig modal
        this.showMessage('Funkcja dodawania minifigurek będzie dostępna wkrótce', false);
    }

    showAddWantedMinifigModal() {
        // TODO: Implement wanted minifig modal
        this.showMessage('Funkcja dodawania minifigurek do listy życzeń będzie dostępna wkrótce', false);
    }

    closeModal(modal) {
        modal.classList.remove('active');
    }

    async autoSearchSet(setNumber) {
        if (!setNumber || setNumber.length < 4) return;

        const cacheKey = `search_${setNumber}`;
        
        // Check cache first
        const cachedResults = apiCache.get(cacheKey);
        if (cachedResults) {
            this.processSearchResults(cachedResults, 'set');
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/profile/search/sets?q=${encodeURIComponent(setNumber)}&limit=5`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                // Cache the results
                apiCache.set(cacheKey, data);
                
                this.processSearchResults(data, 'set');
            }
        } catch (error) {
            console.error('Auto search error:', error);
            // Don't show error message for auto-search
        }
    }

    async searchSet(type) {
        const setNumber = type === 'set' ? 
            document.getElementById('setNumber').value : 
            document.getElementById('wantedSetNumber').value;

        if (!setNumber) {
            this.showMessage('Wprowadź numer zestawu', true);
            return;
        }

        const cacheKey = `search_${setNumber}`;
        
        // Check cache first
        const cachedResults = apiCache.get(cacheKey);
        if (cachedResults) {
            this.processSearchResults(cachedResults, type);
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/profile/search/sets?q=${encodeURIComponent(setNumber)}&limit=5`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                // Cache the results
                apiCache.set(cacheKey, data);
                
                this.processSearchResults(data, type);
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showMessage('Błąd podczas wyszukiwania zestawu', true);
        }
    }
    
    processSearchResults(data, type) {
                if (data.results && data.results.length > 0) {
            if (data.results.length === 1) {
                // Single result - auto-fill
                    const set = data.results[0];
                    if (type === 'set') {
                        document.getElementById('setName').value = set.name;
                    } else {
                        document.getElementById('wantedSetName').value = set.name;
                    }
                    this.showMessage('Zestaw znaleziony!', false);
            } else {
                // Multiple results - show selection modal
                this.showSetSelectionModal(data.results, type);
            }
                } else {
                    this.showMessage('Nie znaleziono zestawu o podanym numerze', true);
                }
            }
    
    showSetSelectionModal(sets, type) {
        const modalId = 'setSelectionModal';
        const modalHTML = `
            <div class="modal" id="${modalId}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Wybierz zestaw</h3>
                        <button class="close-btn" onclick="dashboardManager.closeModal(document.getElementById('${modalId}'))">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p>Znaleziono ${sets.length} zestawów. Wybierz właściwy:</p>
                        <div class="set-selection-list">
                            ${sets.map(set => `
                                <div class="set-selection-item" onclick="dashboardManager.selectSet('${set.set_number}', '${set.name.replace(/'/g, "\\'")}', '${type}')">
                                    <div class="set-info">
                                        <h4>${set.name}</h4>
                                        <p class="set-number">#${set.set_number}</p>
                                        ${set.theme ? `<p class="set-theme">Temat: ${set.theme}</p>` : ''}
                                        ${set.year_released ? `<p class="set-year">Rok: ${set.year_released}</p>` : ''}
                                        ${set.pieces ? `<p class="set-pieces">Elementy: ${set.pieces}</p>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="dashboardManager.closeModal(document.getElementById('${modalId}'))">Anuluj</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
        
        // Store reference for cleanup
        this.currentSelectionModal = modal;
    }
    
    selectSet(setNumber, setName, type) {
        if (type === 'set') {
            document.getElementById('setNumber').value = setNumber;
            document.getElementById('setName').value = setName;
        } else {
            document.getElementById('wantedSetNumber').value = setNumber;
            document.getElementById('wantedSetName').value = setName;
        }
        
        this.closeModal(this.currentSelectionModal);
        this.showMessage('Zestaw wybrany!', false);
        
        // Clean up modal from DOM
        this.currentSelectionModal.remove();
        this.currentSelectionModal = null;
    }

    async handleEditProfile(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const profileData = {
            name: formData.get('name'),
            username: formData.get('username'),
            country: formData.get('country')
        };

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileData)
            });

            if (response.ok) {
                const data = await response.json();
                currentUser = data.data.user;
                this.updateProfileDisplay();
                this.closeModal(editProfileModal);
                this.showMessage('Profil zaktualizowany pomyślnie!', false);
            } else {
                const error = await response.json();
                this.showMessage(error.error || 'Błąd aktualizacji profilu', true);
            }
        } catch (error) {
            console.error('Edit profile error:', error);
            this.showMessage('Błąd połączenia z serwerem', true);
        }
    }

    async handleAddSet(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const setData = {
            set_number: formData.get('set_number'),
            set_name: formData.get('set_name'),
            condition_status: formData.get('condition_status'),
            purchase_date: formData.get('purchase_date') || null,
            purchase_price: formData.get('purchase_price') ? parseFloat(formData.get('purchase_price')) : null,
            purchase_currency: formData.get('purchase_currency') || 'PLN',
            has_minifigures: formData.get('has_minifigures') === '1',
            has_instructions: formData.get('has_instructions') === '1',
            has_box: formData.get('has_box') === '1',
            has_building_blocks: formData.get('has_building_blocks') === '1',
            notes: formData.get('notes')
        };

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/profile/collection/sets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(setData)
            });

            if (response.ok) {
                this.closeModal(addSetModal);
                this.showMessage('Zestaw dodany do kolekcji!', false);
                // Clear cache and reload data
                apiCache.clear();
                this.loadCollectionData();
                e.target.reset();
            } else {
                const error = await response.json();
                this.showMessage(error.error || 'Błąd dodawania zestawu', true);
            }
        } catch (error) {
            console.error('Add set error:', error);
            this.showMessage('Błąd połączenia z serwerem', true);
        }
    }

    async handleAddWantedSet(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const setData = {
            set_number: formData.get('set_number'),
            set_name: formData.get('set_name'),
            max_price: formData.get('max_price') ? parseFloat(formData.get('max_price')) : null,
            priority: parseInt(formData.get('priority')),
            notes: formData.get('notes')
        };

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/profile/collection/wanted-sets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(setData)
            });

            if (response.ok) {
                this.closeModal(addWantedSetModal);
                this.showMessage('Zestaw dodany do listy życzeń!', false);
                // Clear cache and reload data
                apiCache.clear();
                this.loadCollectionData();
                e.target.reset();
            } else {
                const error = await response.json();
                this.showMessage(error.error || 'Błąd dodawania zestawu', true);
            }
        } catch (error) {
            console.error('Add wanted set error:', error);
            this.showMessage('Błąd połączenia z serwerem', true);
        }
    }

    async deleteItem(type, id) {
        if (!confirm('Czy na pewno chcesz usunąć ten element?')) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/profile/collection/${type}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                this.showMessage('Element usunięty pomyślnie!', false);
                // Clear cache and reload data
                apiCache.clear();
                this.loadCollectionData();
            } else {
                const error = await response.json();
                this.showMessage(error.error || 'Błąd usuwania elementu', true);
            }
        } catch (error) {
            console.error('Delete item error:', error);
            this.showMessage('Błąd połączenia z serwerem', true);
        }
    }

    editItem(type, id) {
        // Find the item in collection data
        let item = null;
        let itemArray = null;
        
        switch(type) {
            case 'owned-set':
                itemArray = collectionData.owned_sets;
                break;
            case 'wanted-set':
                itemArray = collectionData.wanted_sets;
                break;
            case 'owned-minifig':
                itemArray = collectionData.owned_minifigs;
                break;
            case 'wanted-minifig':
                itemArray = collectionData.wanted_minifigs;
                break;
        }
        
        if (itemArray) {
            item = itemArray.find(item => item.id === id);
        }
        
        if (!item) {
            this.showMessage('Nie znaleziono elementu do edycji', true);
            return;
        }
        
        this.showEditItemModal(type, item);
    }
    
    showEditItemModal(type, item) {
        // Create modal HTML dynamically
        const modalId = 'editItemModal';
        let modalHTML = '';
        
        if (type.includes('set')) {
            modalHTML = `
                <div class="modal" id="${modalId}">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Edytuj zestaw</h3>
                            <button class="close-btn" onclick="dashboardManager.closeModal(document.getElementById('${modalId}'))">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <form id="editItemForm">
                            <div class="form-group">
                                <label for="editSetNumber">Numer zestawu</label>
                                <input type="text" id="editSetNumber" name="set_number" value="${item.set_number}" readonly>
                            </div>
                            <div class="form-group">
                                <label for="editSetName">Nazwa zestawu</label>
                                <input type="text" id="editSetName" name="set_name" value="${item.set_name}" required>
                            </div>
                            ${type === 'owned-set' ? `
                            <div class="form-group">
                                <label for="editCondition">Stan</label>
                                <select id="editCondition" name="condition_status" required>
                                    <option value="factory_sealed" ${item.condition_status === 'factory_sealed' ? 'selected' : ''}>Zapakowany fabrycznie</option>
                                    <option value="new" ${item.condition_status === 'new' ? 'selected' : ''}>Nowy</option>
                                    <option value="used" ${item.condition_status === 'used' ? 'selected' : ''}>Używany</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editPurchaseDate">Data zakupu</label>
                                <input type="date" id="editPurchaseDate" name="purchase_date" value="${item.purchase_date || ''}">
                            </div>
                            <div class="form-group">
                                <label for="editPurchasePrice">Cena zakupu</label>
                                <div class="price-input-group">
                                    <input type="number" id="editPurchasePrice" name="purchase_price" step="0.01" value="${item.purchase_price || ''}">
                                    <select id="editPurchaseCurrency" name="purchase_currency">
                                        <option value="PLN" ${item.purchase_currency === 'PLN' ? 'selected' : ''}>PLN</option>
                                        <option value="EUR" ${item.purchase_currency === 'EUR' ? 'selected' : ''}>EUR</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Komponenty zestawu</label>
                                <div class="checkbox-group">
                                    <label class="checkbox-item">
                                        <input type="checkbox" name="has_minifigures" value="1" ${item.has_minifigures ? 'checked' : ''}>
                                        <span class="checkmark"></span>
                                        Figurki
                                    </label>
                                    <label class="checkbox-item">
                                        <input type="checkbox" name="has_instructions" value="1" ${item.has_instructions ? 'checked' : ''}>
                                        <span class="checkmark"></span>
                                        Instrukcje
                                    </label>
                                    <label class="checkbox-item">
                                        <input type="checkbox" name="has_box" value="1" ${item.has_box ? 'checked' : ''}>
                                        <span class="checkmark"></span>
                                        Pudełko
                                    </label>
                                    <label class="checkbox-item">
                                        <input type="checkbox" name="has_building_blocks" value="1" ${item.has_building_blocks ? 'checked' : ''}>
                                        <span class="checkmark"></span>
                                        Klocki budowlane
                                    </label>
                                </div>
                            </div>
                            ` : `
                            <div class="form-group">
                                <label for="editMaxPrice">Maksymalna cena</label>
                                <input type="number" id="editMaxPrice" name="max_price" step="0.01" value="${item.max_price || ''}">
                            </div>
                            <div class="form-group">
                                <label for="editPriority">Priorytet</label>
                                <select id="editPriority" name="priority" required>
                                    <option value="1" ${item.priority === 1 ? 'selected' : ''}>1 - Najwyższy</option>
                                    <option value="2" ${item.priority === 2 ? 'selected' : ''}>2 - Wysoki</option>
                                    <option value="3" ${item.priority === 3 ? 'selected' : ''}>3 - Średni</option>
                                    <option value="4" ${item.priority === 4 ? 'selected' : ''}>4 - Niski</option>
                                    <option value="5" ${item.priority === 5 ? 'selected' : ''}>5 - Najniższy</option>
                                </select>
                            </div>
                            `}
                            <div class="form-group">
                                <label for="editNotes">Notatki</label>
                                <textarea id="editNotes" name="notes" rows="3">${item.notes || ''}</textarea>
                            </div>
                            <div class="form-group">
                                <label for="editPhoto">Zdjęcie zestawu</label>
                                <input type="file" id="editPhoto" name="photo" accept="image/*" onchange="dashboardManager.previewImage(this)">
                                <div id="editPhotoPreview" class="photo-preview"></div>
                                ${item.photo_url ? `<p class="current-photo">Aktualne zdjęcie: <a href="${item.photo_url}" target="_blank">Zobacz</a></p>` : ''}
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="dashboardManager.closeModal(document.getElementById('${modalId}'))">Anuluj</button>
                                <button type="submit" class="btn btn-primary">Zapisz zmiany</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        } else {
            // Minifig edit modal
            modalHTML = `
                <div class="modal" id="${modalId}">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Edytuj minifigurkę</h3>
                            <button class="close-btn" onclick="dashboardManager.closeModal(document.getElementById('${modalId}'))">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <form id="editItemForm">
                            <div class="form-group">
                                <label for="editMinifigName">Nazwa minifigurki</label>
                                <input type="text" id="editMinifigName" name="minifig_name" value="${item.minifig_name}" required>
                            </div>
                            <div class="form-group">
                                <label for="editMinifigNumber">Numer minifigurki</label>
                                <input type="text" id="editMinifigNumber" name="minifig_number" value="${item.minifig_number || ''}">
                            </div>
                            ${type === 'owned-minifig' ? `
                            <div class="form-group">
                                <label for="editCondition">Stan</label>
                                <select id="editCondition" name="condition_status" required>
                                    <option value="new" ${item.condition_status === 'new' ? 'selected' : ''}>Nowa</option>
                                    <option value="used" ${item.condition_status === 'used' ? 'selected' : ''}>Używana</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editPurchasePrice">Cena zakupu</label>
                                <input type="number" id="editPurchasePrice" name="purchase_price" step="0.01" value="${item.purchase_price || ''}">
                            </div>
                            ` : `
                            <div class="form-group">
                                <label for="editMaxPrice">Maksymalna cena</label>
                                <input type="number" id="editMaxPrice" name="max_price" step="0.01" value="${item.max_price || ''}">
                            </div>
                            <div class="form-group">
                                <label for="editPriority">Priorytet</label>
                                <select id="editPriority" name="priority" required>
                                    <option value="1" ${item.priority === 1 ? 'selected' : ''}>1 - Najwyższy</option>
                                    <option value="2" ${item.priority === 2 ? 'selected' : ''}>2 - Wysoki</option>
                                    <option value="3" ${item.priority === 3 ? 'selected' : ''}>3 - Średni</option>
                                    <option value="4" ${item.priority === 4 ? 'selected' : ''}>4 - Niski</option>
                                    <option value="5" ${item.priority === 5 ? 'selected' : ''}>5 - Najniższy</option>
                                </select>
                            </div>
                            `}
                            <div class="form-group">
                                <label for="editNotes">Notatki</label>
                                <textarea id="editNotes" name="notes" rows="3">${item.notes || ''}</textarea>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="dashboardManager.closeModal(document.getElementById('${modalId}'))">Anuluj</button>
                                <button type="submit" class="btn btn-primary">Zapisz zmiany</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        }
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
        
        // Add form submit handler
        const form = document.getElementById('editItemForm');
        form.addEventListener('submit', (e) => this.handleEditItem(e, type, item.id));
        
        // Store reference for cleanup
        this.currentEditModal = modal;
    }
    
    async handleEditItem(e, type, itemId) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const itemData = {};
        const photoFile = formData.get('photo');
        
        // Convert FormData to object (excluding photo file)
        for (let [key, value] of formData.entries()) {
            if (key === 'photo') continue; // Handle photo separately
            
            if (key === 'purchase_price' || key === 'max_price') {
                itemData[key] = value ? parseFloat(value) : null;
            } else if (key === 'priority') {
                itemData[key] = parseInt(value);
            } else if (key.startsWith('has_')) {
                itemData[key] = value === '1';
            } else {
                itemData[key] = value;
            }
        }
        
        try {
            const token = localStorage.getItem('authToken');
            
            // First update the item data
            const response = await fetch(`${API_BASE_URL}/profile/collection/${type}/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(itemData)
            });
            
            if (response.ok) {
                // If there's a photo file, upload it
                if (photoFile && photoFile.size > 0) {
                    await this.uploadImage(photoFile, itemId, type);
                }
                
                this.closeModal(this.currentEditModal);
                this.showMessage('Element zaktualizowany pomyślnie!', false);
                // Clear cache and reload data
                apiCache.clear();
                this.loadCollectionData();
                // Clean up modal from DOM
                this.currentEditModal.remove();
                this.currentEditModal = null;
            } else {
                const error = await response.json();
                this.showMessage(error.error || 'Błąd aktualizacji elementu', true);
            }
        } catch (error) {
            console.error('Edit item error:', error);
            this.showMessage('Błąd połączenia z serwerem', true);
        }
    }

    handleLogout() {
        localStorage.removeItem('authToken');
        window.location.href = '/index.html';
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

        setTimeout(() => {
            messageContainer.classList.add('hidden');
        }, 5000);
    }

    initNotifications() {
        // Check for notifications every 5 minutes
        setInterval(() => {
            this.checkPriceNotifications();
        }, 5 * 60 * 1000);
        
        // Check immediately on load
        this.checkPriceNotifications();
    }

    async checkPriceNotifications() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/profile/notifications/price-alerts`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const notifications = await response.json();
                if (notifications.alerts && notifications.alerts.length > 0) {
                    this.showPriceNotifications(notifications.alerts);
                }
            }
        } catch (error) {
            console.error('Error checking price notifications:', error);
        }
    }

    showPriceNotifications(notifications) {
        // Create notifications container if it doesn't exist
        let notificationsContainer = document.getElementById('priceNotificationsContainer');
        if (!notificationsContainer) {
            notificationsContainer = document.createElement('div');
            notificationsContainer.id = 'priceNotificationsContainer';
            notificationsContainer.className = 'price-notifications-container';
            document.body.appendChild(notificationsContainer);
        }

        // Clear existing notifications
        notificationsContainer.innerHTML = '';

        notifications.forEach(notification => {
            const notificationElement = document.createElement('div');
            notificationElement.className = 'price-notification';
            
            const priceChange = notification.price_change;
            const isPriceDrop = priceChange < 0;
            const changeClass = isPriceDrop ? 'price-drop' : 'price-rise';
            const changeIcon = isPriceDrop ? 'fas fa-arrow-down' : 'fas fa-arrow-up';
            
            notificationElement.innerHTML = `
                <div class="notification-header">
                    <i class="fas fa-bell"></i>
                    <span>Powiadomienie o cenie</span>
                    <button class="close-notification" onclick="this.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="notification-content">
                    <h4>${notification.set_name} (#${notification.set_number})</h4>
                    <div class="price-info">
                        <span class="old-price">Stara cena: ${notification.old_price} PLN</span>
                        <span class="new-price ${changeClass}">
                            <i class="${changeIcon}"></i>
                            Nowa cena: ${notification.new_price} PLN
                            (${isPriceDrop ? '' : '+'}${priceChange.toFixed(2)} PLN)
                        </span>
                    </div>
                    <p class="store-info">Sklep: ${notification.store_name}</p>
                    <div class="notification-actions">
                        <a href="${notification.product_url}" target="_blank" class="btn btn-primary btn-sm">
                            <i class="fas fa-external-link-alt"></i> Zobacz ofertę
                        </a>
                        <button class="btn btn-secondary btn-sm" onclick="this.closest('.price-notification').remove()">
                            Zamknij
                        </button>
                    </div>
                </div>
            `;
            
            notificationsContainer.appendChild(notificationElement);
        });

        // Show container
        notificationsContainer.style.display = 'block';
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});
