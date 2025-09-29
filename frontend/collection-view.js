// Collection View Functions
function showUserCollection() {
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
                                    ${userCollection.owned.length > 0 ? userCollection.owned.map(setNumber => `
                                        <div class="set-item">
                                            <div class="set-image">
                                                <div class="set-placeholder">
                                                    <i class="fas fa-cube"></i>
                                                </div>
                                            </div>
                                            <div class="set-info">
                                                <h4>${getSetName(setNumber)}</h4>
                                                <p class="set-number">Set #${setNumber}</p>
                                                <p class="set-details">${getSetDetails(setNumber)}</p>
                                            </div>
                                            <div class="set-actions">
                                                <button class="action-btn remove-btn" onclick="removeFromCollection('${setNumber}', 'owned')">
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
                                    ${userCollection.wanted.length > 0 ? userCollection.wanted.map(setNumber => `
                                        <div class="set-item">
                                            <div class="set-image">
                                                <div class="set-placeholder">
                                                    <i class="fas fa-cube"></i>
                                                </div>
                                            </div>
                                            <div class="set-info">
                                                <h4>${getSetName(setNumber)}</h4>
                                                <p class="set-number">Set #${setNumber}</p>
                                                <p class="set-details">${getSetDetails(setNumber)}</p>
                                            </div>
                                            <div class="set-actions">
                                                <button class="action-btn remove-btn" onclick="removeFromCollection('${setNumber}', 'wanted')">
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
                                    <span class="stat-label">Total Value:</span>
                                    <span class="stat-value">€${((userCollection.owned.length + userCollection.wanted.length) * 79.99).toFixed(2)}</span>
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
        }
        
        .set-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
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
        
        .remove-btn {
            background: #ffebee;
            color: #d32f2f;
        }
        
        .remove-btn:hover {
            background: #ffcdd2;
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

function removeFromCollection(setNumber, type) {
    if (type === 'owned') {
        const index = userCollection.owned.indexOf(setNumber);
        if (index > -1) {
            userCollection.owned.splice(index, 1);
        }
    } else if (type === 'wanted') {
        const index = userCollection.wanted.indexOf(setNumber);
        if (index > -1) {
            userCollection.wanted.splice(index, 1);
        }
    }
    
    saveUserCollection();
    updateCollectionCount();
    
    // Refresh the collection modal
    document.querySelector('.modal')?.remove();
    showUserCollection();
}
