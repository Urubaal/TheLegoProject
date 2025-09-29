// Collection View Functions
const API_BASE_URL = 'http://localhost:3000/api/lego';

// API functions
async function loadCollectionFromAPI() {
    try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('brickBuyToken');
        if (!token) {
            console.warn('No auth token found, using localStorage data');
            return null;
        }

        const response = await fetch(`${API_BASE_URL}/collection`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                return data.data;
            }
        }
        return null;
    } catch (error) {
        console.error('Error loading collection from API:', error);
        return null;
    }
}

async function saveCollectionToAPI(collectionData) {
    try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('brickBuyToken');
        if (!token) {
            console.warn('No auth token found, skipping API save');
            return false;
        }

        // Save owned items
        for (const item of collectionData.owned) {
            await fetch(`${API_BASE_URL}/collection/add`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    setNumber: item.setNumber,
                    collectionType: 'owned',
                    quantity: item.quantity || 1,
                    paidPrice: item.pricePaid || 0,
                    condition: item.condition || 'new',
                    notes: item.notes || '',
                    currency: item.currency || 'PLN',
                    purchaseDate: item.purchaseDate
                })
            });
        }

        // Save wanted items
        for (const item of collectionData.wanted) {
            await fetch(`${API_BASE_URL}/collection/add`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    setNumber: item.setNumber,
                    collectionType: 'wanted',
                    maxPrice: item.maxPrice || 0,
                    priority: item.priority || 1,
                    notes: item.notes || '',
                    currency: item.currency || 'PLN'
                })
            });
        }

        return true;
    } catch (error) {
        console.error('Error saving collection to API:', error);
        return false;
    }
}

async function removeFromCollectionAPI(setNumber, type) {
    try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('brickBuyToken');
        if (!token) {
            console.warn('No auth token found, skipping API delete');
            return false;
        }

        const response = await fetch(`${API_BASE_URL}/collection/${setNumber}/${type}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return response.ok;
    } catch (error) {
        console.error('Error removing from collection via API:', error);
        return false;
    }
}

async function showUserCollection() {
    // Load collection data from API first
    const apiData = await loadCollectionFromAPI();
    if (apiData) {
        userCollection = apiData;
    } else {
        // Fallback to localStorage
        const saved = localStorage.getItem('brickBuyCollection');
        if (saved) {
            try {
                userCollection = JSON.parse(saved);
            } catch (error) {
                console.error('Error loading collection from localStorage:', error);
                userCollection = { owned: [], wanted: [] };
            }
        }
    }

    const collectionModal = document.createElement('div');
    collectionModal.className = 'modal';
    collectionModal.style.display = 'flex';
    
    collectionModal.innerHTML = `
        <div class="modal-content collection-modal">
            <div class="modal-header">
                <h2>My Collection</h2>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="collection-layout">
                    <div class="collection-main">
                        <div class="collection-tabs">
                            <button class="collection-tab active" onclick="switchCollectionTab('owned', this)">
                                <i class="fas fa-check-circle"></i> Owned Sets
                                <span class="tab-count">${userCollection.owned.length}</span>
                            </button>
                            <button class="collection-tab" onclick="switchCollectionTab('wanted', this)">
                                <i class="fas fa-heart"></i> Wanted Sets
                                <span class="tab-count">${userCollection.wanted.length}</span>
                            </button>
                        </div>
                        
                        <div class="collection-content">
                            <div id="ownedSets" class="collection-section active">
                                <div class="collection-header">
                                    <h3>My Owned Sets</h3>
                                    <div class="collection-stats">
                                        <span>${userCollection.owned.length} sets</span>
                                    </div>
                                </div>
                                <div class="sets-list">
                                    ${userCollection.owned.length > 0 ? userCollection.owned.map(item => `
                                        <div class="set-item" onclick="viewSetDetails('${item.setNumber}')">
                                            <div class="set-image">
                                                <div class="set-placeholder">
                                                    <i class="fas fa-cube"></i>
                                                </div>
                                            </div>
                                            <div class="set-info">
                                                <h4>${getSetName(item.setNumber)}</h4>
                                                <p class="set-number">Set #${item.setNumber}</p>
                                                <p class="set-details">${getSetDetails(item.setNumber)}</p>
                                                <div class="collection-details">
                                                    ${item.pricePaid > 0 ? `<span class="detail-item"><i class="fas fa-tag"></i> ${item.pricePaid} PLN</span>` : ''}
                                                    ${item.purchaseDate ? `<span class="detail-item"><i class="fas fa-calendar"></i> ${formatDate(item.purchaseDate)}</span>` : ''}
                                                    ${item.condition ? `<span class="detail-item"><i class="fas fa-check-circle"></i> ${getConditionLabel(item.condition)}</span>` : ''}
                                                    ${item.quantity > 1 ? `<span class="detail-item"><i class="fas fa-layer-group"></i> x${item.quantity}</span>` : ''}
                                                </div>
                                                ${item.notes ? `<p class="set-notes">${item.notes}</p>` : ''}
                                            </div>
                                            <div class="set-actions">
                                                <button class="action-btn edit-btn" onclick="event.stopPropagation(); editCollectionItem('${item.setNumber}', 'owned')">
                                                    <i class="fas fa-edit"></i> Edit
                                                </button>
                                                <button class="action-btn remove-btn" onclick="event.stopPropagation(); removeFromCollection('${item.setNumber}', 'owned')">
                                                    <i class="fas fa-times"></i> Remove
                                                </button>
                                            </div>
                                        </div>
                                    `).join('') : '<div class="empty-state"><i class="fas fa-box-open"></i><p>No owned sets yet</p></div>'}
                                </div>
                            </div>
                            
                            <div id="wantedSets" class="collection-section">
                                <div class="collection-header">
                                    <h3>My Wanted Sets</h3>
                                    <div class="collection-stats">
                                        <span>${userCollection.wanted.length} sets</span>
                                    </div>
                                </div>
                                <div class="sets-list">
                                    ${userCollection.wanted.length > 0 ? userCollection.wanted.map(item => `
                                        <div class="set-item" onclick="viewSetDetails('${item.setNumber}')">
                                            <div class="set-image">
                                                <div class="set-placeholder">
                                                    <i class="fas fa-cube"></i>
                                                </div>
                                            </div>
                                            <div class="set-info">
                                                <h4>${getSetName(item.setNumber)}</h4>
                                                <p class="set-number">Set #${item.setNumber}</p>
                                                <p class="set-details">${getSetDetails(item.setNumber)}</p>
                                                <div class="collection-details">
                                                    ${item.maxPrice > 0 ? `<span class="detail-item"><i class="fas fa-tag"></i> Max ${item.maxPrice} PLN</span>` : ''}
                                                    ${item.priority ? `<span class="detail-item"><i class="fas fa-star"></i> ${getPriorityLabel(item.priority)}</span>` : ''}
                                                </div>
                                                ${item.notes ? `<p class="set-notes">${item.notes}</p>` : ''}
                                            </div>
                                            <div class="set-actions">
                                                <button class="action-btn edit-btn" onclick="event.stopPropagation(); editCollectionItem('${item.setNumber}', 'wanted')">
                                                    <i class="fas fa-edit"></i> Edit
                                                </button>
                                                <button class="action-btn remove-btn" onclick="event.stopPropagation(); removeFromCollection('${item.setNumber}', 'wanted')">
                                                    <i class="fas fa-times"></i> Remove
                                                </button>
                                            </div>
                                        </div>
                                    `).join('') : '<div class="empty-state"><i class="fas fa-heart"></i><p>No wanted sets yet</p></div>'}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="collection-sidebar">
                        <div class="sidebar-section">
                            <h3>Collection Summary</h3>
                            <div class="summary-stats">
                                <div class="stat-row">
                                    <span class="stat-label">Total Sets:</span>
                                    <span class="stat-value">${userCollection.owned.length + userCollection.wanted.length}</span>
                                </div>
                                <div class="stat-row">
                                    <span class="stat-label">Owned:</span>
                                    <span class="stat-value">${userCollection.owned.length}</span>
                                </div>
                                <div class="stat-row">
                                    <span class="stat-label">Wanted:</span>
                                    <span class="stat-value">${userCollection.wanted.length}</span>
                                </div>
                                <div class="stat-row">
                                    <span class="stat-label">Total Pieces:</span>
                                    <span class="stat-value">${(userCollection.owned.length + userCollection.wanted.length) * 1065}</span>
                                </div>
                                <div class="stat-row">
                                    <span class="stat-label">Total Paid:</span>
                                    <span class="stat-value">${userCollection.owned.reduce((sum, item) => sum + (item.pricePaid || 0), 0).toFixed(2)} PLN</span>
                                </div>
                                <div class="stat-row">
                                    <span class="stat-label">Avg Price:</span>
                                    <span class="stat-value">${userCollection.owned.length > 0 ? (userCollection.owned.reduce((sum, item) => sum + (item.pricePaid || 0), 0) / userCollection.owned.length).toFixed(2) : 0} PLN</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="sidebar-section">
                            <h3>Quick Actions</h3>
                            <button class="quick-action-btn" onclick="alert('Feature coming soon!')">
                                <i class="fas fa-plus"></i> Add New Set
                            </button>
                            <button class="quick-action-btn" onclick="alert('Feature coming soon!')">
                                <i class="fas fa-download"></i> Export Collection
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add styles for collection modal
    const style = document.createElement('style');
    style.textContent = `
        .collection-modal {
            max-width: 1200px;
            width: 95%;
            max-height: 90vh;
        }
        
        .collection-layout {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 30px;
            height: 70vh;
        }
        
        .collection-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
        }
        
        .collection-tab {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 20px;
            border: none;
            background: none;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            color: #666;
            border-bottom: 3px solid transparent;
            transition: all 0.3s ease;
        }
        
        .collection-tab.active {
            color: #1976d2;
            border-bottom-color: #1976d2;
        }
        
        .collection-tab:hover {
            color: #1976d2;
        }
        
        .tab-count {
            background: #f0f0f0;
            color: #666;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .collection-tab.active .tab-count {
            background: #1976d2;
            color: white;
        }
        
        .collection-section {
            display: none;
        }
        
        .collection-section.active {
            display: block;
        }
        
        .collection-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .collection-header h3 {
            margin: 0;
            color: #333;
            font-size: 20px;
            font-weight: 700;
        }
        
        .collection-stats span {
            background: #f8f9fa;
            color: #666;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
        }
        
        .sets-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
            max-height: 400px;
            overflow-y: auto;
            padding-right: 10px;
        }
        
        .set-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .set-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            border-color: #1976d2;
        }
        
        .set-image {
            width: 60px;
            height: 60px;
            flex-shrink: 0;
        }
        
        .set-placeholder {
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
            font-size: 24px;
        }
        
        .set-info {
            flex: 1;
        }
        
        .set-info h4 {
            margin: 0 0 5px 0;
            color: #333;
            font-size: 16px;
            font-weight: 600;
        }
        
        .set-number {
            margin: 0 0 5px 0;
            color: #666;
            font-size: 14px;
        }
        
        .set-details {
            margin: 0;
            color: #888;
            font-size: 13px;
        }
        
        .set-actions {
            display: flex;
            gap: 10px;
        }
        
        .action-btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .edit-btn {
            background: #e3f2fd;
            color: #1976d2;
        }
        
        .edit-btn:hover {
            background: #bbdefb;
        }
        
        .remove-btn {
            background: #ffebee;
            color: #d32f2f;
        }
        
        .remove-btn:hover {
            background: #ffcdd2;
        }
        
        .collection-details {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 8px 0;
        }
        
        .detail-item {
            display: flex;
            align-items: center;
            gap: 4px;
            background: #f8f9fa;
            color: #666;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .detail-item i {
            font-size: 10px;
        }
        
        .set-notes {
            margin: 8px 0 0 0;
            color: #666;
            font-size: 13px;
            font-style: italic;
            background: #f8f9fa;
            padding: 8px;
            border-radius: 6px;
            border-left: 3px solid #1976d2;
        }
        
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #999;
        }
        
        .empty-state i {
            font-size: 48px;
            margin-bottom: 15px;
            display: block;
        }
        
        .empty-state p {
            margin: 0;
            font-size: 16px;
        }
        
        .collection-sidebar {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .sidebar-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #e0e0e0;
        }
        
        .sidebar-section h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 16px;
            font-weight: 600;
        }
        
        .summary-stats {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .stat-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .stat-label {
            color: #666;
            font-size: 14px;
        }
        
        .stat-value {
            color: #333;
            font-weight: 600;
            font-size: 14px;
        }
        
        .quick-action-btn {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            background: white;
            color: #333;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 10px;
        }
        
        .quick-action-btn:hover {
            border-color: #1976d2;
            color: #1976d2;
        }
        
        @media (max-width: 768px) {
            .collection-layout {
                grid-template-columns: 1fr;
                gap: 20px;
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(collectionModal);
    
    // Close modal when clicking outside
    collectionModal.addEventListener('click', function(e) {
        if (e.target === collectionModal) {
            collectionModal.remove();
            style.remove();
        }
    });
}

function switchCollectionTab(tabName, button) {
    // Remove active class from all tabs and sections
    document.querySelectorAll('.collection-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.collection-section').forEach(section => section.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding section
    button.classList.add('active');
    document.getElementById(tabName + 'Sets').classList.add('active');
}

function getSetName(setNumber) {
    const setNames = {
        '75399-1': 'Rebel U-Wing Starfighter',
        '75313-1': 'AT-AT',
        '75308-1': 'R2-D2',
        '75341-1': 'Luke Skywalker\'s Landspeeder'
    };
    return setNames[setNumber] || 'Unknown Set';
}

function getSetDetails(setNumber) {
    const setDetails = {
        '75399-1': 'Star Wars • 2024 • 1065 pieces • 4 minifigs',
        '75313-1': 'Star Wars • 2023 • 1267 pieces • 4 minifigs',
        '75308-1': 'Star Wars • 2021 • 2314 pieces • 0 minifigs',
        '75341-1': 'Star Wars • 2022 • 1890 pieces • 2 minifigs'
    };
    return setDetails[setNumber] || 'Unknown details';
}

async function removeFromCollection(setNumber, type) {
    // Remove from API first
    const apiSuccess = await removeFromCollectionAPI(setNumber, type);
    
    // Remove from local collection
    if (type === 'owned') {
        const index = userCollection.owned.findIndex(item => item.setNumber === setNumber);
        if (index > -1) {
            userCollection.owned.splice(index, 1);
        }
    } else if (type === 'wanted') {
        const index = userCollection.wanted.findIndex(item => item.setNumber === setNumber);
        if (index > -1) {
            userCollection.wanted.splice(index, 1);
        }
    }
    
    // Save to localStorage as backup
    localStorage.setItem('brickBuyCollection', JSON.stringify(userCollection));
    
    // Update button states on main page if the function exists
    if (typeof updateButtonStates === 'function') {
        updateButtonStates();
    }
    if (typeof updateCollectionCount === 'function') {
        updateCollectionCount();
    }
    
    // Refresh the collection modal
    document.querySelector('.modal')?.remove();
    showUserCollection();
}

function editCollectionItem(setNumber, type) {
    const item = type === 'owned' 
        ? userCollection.owned.find(item => item.setNumber === setNumber)
        : userCollection.wanted.find(item => item.setNumber === setNumber);
    
    if (!item) return;
    
    // Show edit modal (similar to add modal but pre-filled)
    showEditCollectionModal(setNumber, type, item);
}

function showEditCollectionModal(setNumber, collectionType, item) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    const isOwned = collectionType === 'owned';
    const setInfo = getSetInfo(setNumber);
    
    modal.innerHTML = `
        <div class="modal-content collection-modal">
            <div class="modal-header">
                <h2>Edytuj element kolekcji</h2>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="set-preview">
                    <div class="set-image">🚀</div>
                    <div class="set-info">
                        <h3>${setInfo.name}</h3>
                        <p>Set #${setNumber} • ${setInfo.theme} • ${setInfo.year}</p>
                    </div>
                </div>
                
                <form id="collectionForm" class="collection-form">
                    ${isOwned ? `
                        <div class="form-group">
                            <label for="pricePaid">Cena zakupu</label>
                            <div class="price-input-group">
                                <input type="number" id="pricePaid" name="pricePaid" step="0.01" min="0" value="${item.pricePaid || 0}">
                                <select id="currency" name="currency" class="currency-select">
                                    <option value="PLN" ${(item.currency || 'PLN') === 'PLN' ? 'selected' : ''}>PLN</option>
                                    <option value="EUR" ${item.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="purchaseDate">Data zakupu</label>
                            <input type="date" id="purchaseDate" name="purchaseDate" value="${item.purchaseDate || new Date().toISOString().split('T')[0]}">
                        </div>
                        
                        <div class="form-group">
                            <label for="condition">Stan</label>
                            <select id="condition" name="condition">
                                <option value="new" ${item.condition === 'new' ? 'selected' : ''}>Nowy</option>
                                <option value="used-excellent" ${item.condition === 'used-excellent' ? 'selected' : ''}>Używany - Bardzo dobry</option>
                                <option value="used-good" ${item.condition === 'used-good' ? 'selected' : ''}>Używany - Dobry</option>
                                <option value="used-fair" ${item.condition === 'used-fair' ? 'selected' : ''}>Używany - Średni</option>
                                <option value="incomplete" ${item.condition === 'incomplete' ? 'selected' : ''}>Niekompletny</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="quantity">Ilość</label>
                            <input type="number" id="quantity" name="quantity" min="1" value="${item.quantity || 1}">
                        </div>
                    ` : `
                        <div class="form-group">
                            <label for="maxPrice">Maksymalna cena</label>
                            <div class="price-input-group">
                                <input type="number" id="maxPrice" name="maxPrice" step="0.01" min="0" value="${item.maxPrice || 0}">
                                <select id="currency" name="currency" class="currency-select">
                                    <option value="PLN" ${(item.currency || 'PLN') === 'PLN' ? 'selected' : ''}>PLN</option>
                                    <option value="EUR" ${item.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="priority">Priorytet</label>
                            <select id="priority" name="priority">
                                <option value="1" ${item.priority === 1 ? 'selected' : ''}>Bardzo wysoki</option>
                                <option value="2" ${item.priority === 2 ? 'selected' : ''}>Wysoki</option>
                                <option value="3" ${item.priority === 3 ? 'selected' : ''}>Średni</option>
                                <option value="4" ${item.priority === 4 ? 'selected' : ''}>Niski</option>
                                <option value="5" ${item.priority === 5 ? 'selected' : ''}>Bardzo niski</option>
                            </select>
                        </div>
                    `}
                    
                    <div class="form-group">
                        <label for="notes">Notatki</label>
                        <textarea id="notes" name="notes" rows="3" placeholder="Dodatkowe informacje...">${item.notes || ''}</textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Anuluj</button>
                        <button type="submit" class="btn btn-primary">Zapisz zmiany</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Add styles for collection modal (reuse existing styles)
    const style = document.createElement('style');
    style.textContent = `
        .collection-modal {
            max-width: 500px;
            width: 95%;
        }
        
        .set-preview {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .set-preview .set-image {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            flex-shrink: 0;
        }
        
        .set-preview .set-info h3 {
            margin: 0 0 5px 0;
            color: #333;
            font-size: 16px;
            font-weight: 600;
        }
        
        .set-preview .set-info p {
            margin: 0;
            color: #666;
            font-size: 14px;
        }
        
        .collection-form {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .form-group label {
            font-weight: 600;
            color: #333;
            font-size: 14px;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
            padding: 10px 12px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.3s ease;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #1976d2;
        }
        
        .price-input-group {
            display: flex;
            gap: 8px;
        }
        
        .price-input-group input {
            flex: 1;
        }
        
        .currency-select {
            min-width: 80px;
            flex-shrink: 0;
        }
        
        .form-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 20px;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    // Handle form submission
    modal.querySelector('#collectionForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        
        if (isOwned) {
            item.pricePaid = parseFloat(formData.get('pricePaid')) || 0;
            item.currency = formData.get('currency') || 'PLN';
            item.purchaseDate = formData.get('purchaseDate');
            item.condition = formData.get('condition');
            item.quantity = parseInt(formData.get('quantity')) || 1;
        } else {
            item.maxPrice = parseFloat(formData.get('maxPrice')) || 0;
            item.currency = formData.get('currency') || 'PLN';
            item.priority = parseInt(formData.get('priority')) || 1;
        }
        
        item.notes = formData.get('notes') || '';
        
        // Save to API
        await saveCollectionToAPI(userCollection);
        
        // Save to localStorage as backup
        localStorage.setItem('brickBuyCollection', JSON.stringify(userCollection));
        
        updateButtonStates();
        if (typeof updateCollectionCount === 'function') {
            updateCollectionCount();
        }
        
        modal.remove();
        style.remove();
        
        // Refresh the collection modal
        document.querySelector('.modal')?.remove();
        showUserCollection();
        
        showToast('Element kolekcji został zaktualizowany!', 'success');
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
            style.remove();
        }
    });
}

function getSetInfo(setNumber) {
    const setInfo = {
        '75399-1': {
            name: 'Rebel U-Wing Starfighter',
            theme: 'Star Wars',
            year: '2024'
        }
    };
    return setInfo[setNumber] || { name: 'Unknown Set', theme: 'Unknown', year: 'Unknown' };
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL');
}

function getConditionLabel(condition) {
    const labels = {
        'new': 'Nowy',
        'used-excellent': 'Używany - Bardzo dobry',
        'used-good': 'Używany - Dobry',
        'used-fair': 'Używany - Średni',
        'incomplete': 'Niekompletny'
    };
    return labels[condition] || condition;
}

function getPriorityLabel(priority) {
    const labels = {
        1: 'Bardzo wysoki',
        2: 'Wysoki',
        3: 'Średni',
        4: 'Niski',
        5: 'Bardzo niski'
    };
    return labels[priority] || 'Nieznany';
}

function viewSetDetails(setNumber) {
    // Close collection modal first
    document.querySelector('.modal')?.remove();
    
    // Navigate to set detail page
    window.location.href = `set-detail.html?set=${setNumber}`;
}
