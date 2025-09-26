// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Global state
let currentUser = null;
let collectionData = {
    owned_sets: [],
    wanted_sets: [],
    owned_minifigs: [],
    wanted_minifigs: []
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

        document.getElementById('profileName').textContent = currentUser.name || 'Brak nazwy';
        document.getElementById('profileUsername').textContent = `@${currentUser.username}`;
        document.getElementById('profileEmail').textContent = currentUser.email;
        document.getElementById('profileCountry').textContent = `Kraj: ${currentUser.country || 'Nie ustawiono'}`;
        document.getElementById('profileMemberSince').textContent = `Członek od: ${new Date(currentUser.created_at).toLocaleDateString('pl-PL')}`;
    }

    async loadCollectionData() {
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
                this.updateCollectionStats();
                this.renderCollection();
            }
        } catch (error) {
            console.error('Error loading collection:', error);
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

        grid.innerHTML = collectionData.owned_sets.map(set => `
            <div class="collection-item">
                <div class="item-image">
                    <i class="fas fa-cube"></i>
                </div>
                <div class="item-info">
                    <h3>${set.set_name}</h3>
                    <p class="item-number">#${set.set_number}</p>
                    <p class="item-condition">Stan: ${set.condition_status === 'new' ? 'Nowy' : 'Używany'}</p>
                    ${set.purchase_price ? `<p class="item-price">Cena: ${set.purchase_price} ${set.purchase_currency || 'PLN'}</p>` : ''}
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
        `).join('');
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

    async searchSet(type) {
        const setNumber = type === 'set' ? 
            document.getElementById('setNumber').value : 
            document.getElementById('wantedSetNumber').value;

        if (!setNumber) {
            this.showMessage('Wprowadź numer zestawu', true);
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/profile/search/sets?q=${encodeURIComponent(setNumber)}&limit=1`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    const set = data.results[0];
                    if (type === 'set') {
                        document.getElementById('setName').value = set.name;
                    } else {
                        document.getElementById('wantedSetName').value = set.name;
                    }
                    this.showMessage('Zestaw znaleziony!', false);
                } else {
                    this.showMessage('Nie znaleziono zestawu o podanym numerze', true);
                }
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showMessage('Błąd podczas wyszukiwania zestawu', true);
        }
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
            purchase_price: formData.get('purchase_price') ? parseFloat(formData.get('purchase_price')) : null,
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
        // TODO: Implement edit functionality
        this.showMessage('Funkcja edycji będzie dostępna wkrótce', false);
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
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});
