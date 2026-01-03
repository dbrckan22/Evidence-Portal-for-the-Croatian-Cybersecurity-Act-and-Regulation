const API_URL = "http://localhost:5059/api/v1";

let categories = [];
let selectedCategoryId = null;
let obligations = [];
let selectedObligationId = null;
let userId = null;
let organizationId = null;

document.addEventListener("DOMContentLoaded", () => {
    userId = sessionStorage.getItem('userId');
    organizationId = sessionStorage.getItem('organizationId');
    
    if (!userId) {
        userId = 1;
        organizationId = 1;
    }

    showUploadForm();
    loadCategories();
    loadComplianceSummary();
    setupEventListeners();
});

function setupEventListeners() {
    const uploadForm = document.getElementById('upload-form');
    uploadForm.addEventListener('submit', handleFormSubmit);

    const logoutButton = document.getElementById('logout-button');
    logoutButton.addEventListener('click', handleLogout);

    const exportButton = document.getElementById('export-button');
    exportButton.addEventListener('click', handleExport);

    const backToObligations = document.getElementById('back-to-obligations');
    backToObligations.addEventListener('click', () => {
        showObligationsView();
    });

    const backToUploadFromObligations = document.getElementById('back-to-upload-from-obligations');
    backToUploadFromObligations.addEventListener('click', () => {
        showUploadForm();
    });

    const logoButton = document.querySelector('.dash-button-logo');
    logoButton.addEventListener('click', () => {
        showUploadForm();
    });
}

async function loadCategories() {
    const categoriesList = document.getElementById('categories-list');
    
    try {
        categoriesList.innerHTML = '<div class="loading-message">UÄitavanje kategorija...</div>';
        
        const response = await fetch(`${API_URL}/categories`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        categories = await response.json();
        
        if (categories.length === 0) {
            categoriesList.innerHTML = '<div class="loading-message">Nema dostupnih kategorija</div>';
            return;
        }
        
        renderCategories(categories);
        
    } catch (error) {
        console.error('Error loading categories:', error);
        categoriesList.innerHTML = `
            <div class="loading-message" style="color: #dc2626;">
                GreÅ¡ka pri uÄitavanju kategorija.<br>
                Provjerite je li backend pokrenut.
            </div>
        `;
        showNotification('GreÅ¡ka pri uÄitavanju kategorija: ' + error.message, 'error');
    }
}

async function loadComplianceSummary() {
    try {
        const response = await fetch(`${API_URL}/compliance/summary?organizationId=${organizationId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const summary = await response.json();
        
        updateProgressCard(summary);
        
    } catch (error) {
        console.error('Error loading compliance summary:', error);
    }
}

function updateProgressCard(summary) {
    const progressSubtitle = document.getElementById('progress-subtitle');
    const progressPercentage = document.getElementById('progress-percentage');
    const progressFill = document.getElementById('progress-fill');
    const statValid = document.getElementById('stat-valid');
    const statExpiring = document.getElementById('stat-expiring');
    const statExpired = document.getElementById('stat-expired');
    const statMissing = document.getElementById('stat-missing');
    
    progressSubtitle.textContent = `${summary.coveredObligations} od ${summary.totalObligations} obveza pokriveno dokazima`;
    progressPercentage.textContent = `${summary.coveragePercent}%`;
    progressFill.style.width = `${summary.coveragePercent}%`;
    
    statValid.textContent = summary.valid;
    statExpiring.textContent = summary.expiringSoon;
    statExpired.textContent = summary.expired;
    statMissing.textContent = summary.missing;
}

function renderCategories(categoriesData) {
    const categoriesList = document.getElementById('categories-list');
    
    categoriesList.innerHTML = categoriesData.map(category => {
        const completedCount = category.completedObligations || 0;
        const totalCount = category.totalObligations || category.obligationCount || 0;
        const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        
        let progressClass = 'none';
        if (progressPercent === 100) progressClass = 'complete';
        else if (progressPercent > 0) progressClass = 'partial';
        
        return `
            <div class="category-item" data-category-id="${category.categoryId || category.id}" onclick="selectCategory(${category.categoryId || category.id})">
                <div class="category-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" 
                         fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" 
                         stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="9" x2="15" y2="9"></line>
                        <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                </div>
                <div class="category-content">
                    <div class="category-header">
                        <span class="category-name">${category.name || category.title}</span>
                        <span class="category-progress ${progressClass}">${progressPercent}%</span>
                    </div>
                    <div class="category-obligations">${completedCount}/${totalCount} obveza</div>
                </div>
            </div>
        `;
    }).join('');
}

async function selectCategory(categoryId) {
    selectedCategoryId = categoryId;
    
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('selected');
    });
    document.querySelector(`[data-category-id="${categoryId}"]`).classList.add('selected');
    
    await loadObligations(categoryId);
}

async function loadObligations(categoryId) {
    const obligationsList = document.getElementById('obligations-list');
    
    try {
        obligationsList.innerHTML = '<div class="loading-message">UÄitavanje obveza...</div>';
        
        const response = await fetch(`${API_URL}/categories/${categoryId}/obligations`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        obligations = await response.json();
        
        showObligationsView();
        renderObligations(obligations);
        
    } catch (error) {
        console.error('Error loading obligations:', error);
        obligationsList.innerHTML = '<div class="empty-state">GreÅ¡ka pri uÄitavanju obveza</div>';
        showNotification('GreÅ¡ka pri uÄitavanju obveza: ' + error.message, 'error');
    }
}

function renderObligations(obligationsData) {
    const obligationsList = document.getElementById('obligations-list');
    
    if (obligationsData.length === 0) {
        obligationsList.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" 
                     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" 
                     stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p>Nema obveza za ovu kategoriju</p>
            </div>
        `;
        return;
    }
    
    obligationsList.innerHTML = obligationsData.map(obligation => `
        <div class="obligation-item" onclick="selectObligation(${obligation.obligationId})">
            <div class="obligation-header">
                <div class="obligation-title">${obligation.title}</div>
                <div class="obligation-code">${obligation.code}</div>
            </div>
            ${obligation.legalReference ? `
                <div class="obligation-reference">
                    <strong>Pravna referenca:</strong> ${obligation.legalReference}
                </div>
            ` : ''}
        </div>
    `).join('');
}

async function selectObligation(obligationId) {
    selectedObligationId = obligationId;
    
    const obligation = obligations.find(o => o.obligationId === obligationId);
    
    if (!obligation) return;
    
    document.getElementById('evidence-title').textContent = obligation.title;
    document.getElementById('evidence-subtitle').textContent = obligation.legalReference || 'Dokazi za obvezu';
    
    await loadEvidence(obligationId);
}

async function loadEvidence(obligationId) {
    const evidenceList = document.getElementById('evidence-list');
    
    try {
        evidenceList.innerHTML = '<div class="loading-message">UÄitavanje dokaza...</div>';
        
        const response = await fetch(`${API_URL}/evidence/obligation/${obligationId}?organizationId=${organizationId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const evidence = await response.json();
        
        showEvidenceView();
        renderEvidence(evidence);
        
    } catch (error) {
        console.error('Error loading evidence:', error);
        evidenceList.innerHTML = '<div class="empty-state">GreÅ¡ka pri uÄitavanju dokaza</div>';
        showNotification('GreÅ¡ka pri uÄitavanju dokaza: ' + error.message, 'error');
    }
}

function renderEvidence(evidenceData) {
    const evidenceList = document.getElementById('evidence-list');
    
    if (evidenceData.length === 0) {
        evidenceList.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" 
                     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" 
                     stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
                <p>Nema dokaza za ovu obvezu</p>
                <p style="font-size: 0.75rem; margin-top: 8px;">Koristite Upload formu za dodavanje dokaza</p>
            </div>
        `;
        return;
    }
    
    evidenceList.innerHTML = evidenceData.map(evidence => {
        let statusClass = 'active';
        let statusText = 'Aktivno';
        
        if (evidence.validUntil) {
            const today = new Date();
            const validUntil = new Date(evidence.validUntil);
            const daysUntilExpiry = Math.ceil((validUntil - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry < 0) {
                statusClass = 'expired';
                statusText = 'Isteklo';
            } else if (daysUntilExpiry < 30) {
                statusClass = 'expiring';
                statusText = `IstiÄe za ${daysUntilExpiry} dana`;
            }
        }
        
        return `
            <div class="evidence-item">
                <div class="evidence-header">
                    <div class="evidence-title">${evidence.title}</div>
                    <div class="evidence-status ${statusClass}">${statusText}</div>
                </div>
                
                <div class="evidence-details">
                    <div class="evidence-detail">
                        <span class="evidence-detail-label">Tip dokaza</span>
                        <span>${evidence.evidenceType}</span>
                    </div>
                    <div class="evidence-detail">
                        <span class="evidence-detail-label">Dodao</span>
                        <span>${evidence.addedByUser}</span>
                    </div>
                    <div class="evidence-detail">
                        <span class="evidence-detail-label">Datum uploada</span>
                        <span>${new Date(evidence.createdAt).toLocaleDateString('hr-HR')}</span>
                    </div>
                    ${evidence.validUntil ? `
                    <div class="evidence-detail">
                        <span class="evidence-detail-label">Datum isteka</span>
                        <span>${new Date(evidence.validUntil).toLocaleDateString('hr-HR')}</span>
                    </div>
                    ` : ''}
                    ${evidence.fileName ? `
                    <div class="evidence-detail">
                        <span class="evidence-detail-label">Datoteka</span>
                        <span>${evidence.fileName}</span>
                    </div>
                    ` : ''}
                    ${evidence.note ? `
                    <div class="evidence-detail" style="grid-column: 1 / -1;">
                        <span class="evidence-detail-label">Napomena</span>
                        <span>${evidence.note}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="evidence-actions">
                    ${evidence.fileName ? `
                        <button class="btn-download" onclick="downloadEvidence(${evidence.evidenceId})">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" 
                                 fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" 
                                 stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Preuzmi
                        </button>
                    ` : ''}
                    <button class="btn-delete" onclick="deleteEvidence(${evidence.evidenceId})">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" 
                             fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" 
                             stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        ObriÅ¡i
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function showObligationsView() {
    document.getElementById('obligations-view').style.display = 'block';
    document.getElementById('evidence-view').style.display = 'none';
    document.getElementById('upload-form').parentElement.style.display = 'none';
}

function showEvidenceView() {
    document.getElementById('obligations-view').style.display = 'none';
    document.getElementById('evidence-view').style.display = 'block';
    document.getElementById('upload-form').parentElement.style.display = 'none';
}

function showUploadForm() {
    document.getElementById('obligations-view').style.display = 'none';
    document.getElementById('evidence-view').style.display = 'none';
    document.getElementById('upload-form').parentElement.style.display = 'block';
}

async function downloadEvidence(evidenceId) {
    try {
        const response = await fetch(`${API_URL}/evidence/download/${evidenceId}?organizationId=${organizationId}`);
        
        if (!response.ok) {
            throw new Error('GreÅ¡ka pri preuzimanju');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'dokument';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification('Dokument uspjeÅ¡no preuzet', 'success');
    } catch (error) {
        console.error('Error downloading evidence:', error);
        showNotification('GreÅ¡ka pri preuzimanju dokumenta', 'error');
    }
}

async function deleteEvidence(evidenceId) {
    if (!confirm('Jeste li sigurni da Å¾elite obrisati ovaj dokaz?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/evidence/${evidenceId}?organizationId=${organizationId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('GreÅ¡ka pri brisanju');
        }
        
        showNotification('Dokaz uspjeÅ¡no obrisan', 'success');
        
        await loadEvidence(selectedObligationId);
        loadComplianceSummary();
        
    } catch (error) {
        console.error('Error deleting evidence:', error);
        showNotification('GreÅ¡ka pri brisanju dokaza', 'error');
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData();
    
    const obligationId = document.getElementById('obligation-select').value;
    const evidenceType = document.getElementById('evidence-type').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const file = document.getElementById('file').files[0];
    const linkUrl = document.getElementById('link').value;
    const responsible = document.getElementById('responsible').value;
    const validFrom = document.getElementById('valid-from').value;
    const validUntil = document.getElementById('valid-until').value;
    
    if (!obligationId) {
        showNotification('Molimo odaberite obvezu', 'error');
        return;
    }
    
    if (!title || !description) {
        showNotification('Molimo ispunite sva obavezna polja', 'error');
        return;
    }
    
    if (!file && !linkUrl) {
        showNotification('Molimo dodajte datoteku ili URL', 'error');
        return;
    }
    
    const evidenceData = {
        obligationId: parseInt(obligationId),
        userId: parseInt(userId),
        evidenceType: evidenceType,
        title: title,
        note: description
    };
    
    if (linkUrl) evidenceData.linkUrl = linkUrl;
    if (validFrom) evidenceData.validFrom = new Date(validFrom).toISOString();
    if (validUntil) evidenceData.validUntil = new Date(validUntil).toISOString();
    
    if (file) {
        Object.keys(evidenceData).forEach(key => {
            formData.append(key, evidenceData[key]);
        });
        formData.append('file', file);
        
        await uploadWithFile(formData);
    } else {
        await uploadWithoutFile(evidenceData);
    }
}

async function uploadWithFile(formData) {
    try {
        const response = await fetch(`${API_URL}/evidence/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Upload failed');
        }
        
        const result = await response.json();
        
        showNotification('Dokaz uspjeÅ¡no uploadan!', 'success');
        
        document.getElementById('upload-form').reset();
        
        loadCategories();
        loadComplianceSummary();
        
        if (selectedCategoryId) {
            loadObligations(selectedCategoryId);
        }
        
    } catch (error) {
        console.error('Error uploading evidence:', error);
        showNotification('GreÅ¡ka pri uploadu: ' + error.message, 'error');
    }
}

async function uploadWithoutFile(evidenceData) {
    try {
        const response = await fetch(`${API_URL}/evidence/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(evidenceData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Upload failed');
        }
        
        const result = await response.json();
        
        showNotification('Dokaz uspjeÅ¡no uploadan!', 'success');
        
        document.getElementById('upload-form').reset();
        
        loadCategories();
        loadComplianceSummary();
        
        if (selectedCategoryId) {
            loadObligations(selectedCategoryId);
        }
        
    } catch (error) {
        console.error('Error uploading evidence:', error);
        showNotification('GreÅ¡ka pri uploadu: ' + error.message, 'error');
    }
}

function handleLogout() {
    sessionStorage.clear();
    window.location.href = '/index.html';
}

async function handleExport() {
    try {
        showNotification('IzvjeÅ¡taj se generira...', 'info');
        
        showNotification('Export funkcionalnost joÅ¡ nije implementirana', 'info');
        
    } catch (error) {
        console.error('Error exporting report:', error);
        showNotification('GreÅ¡ka pri exportu izvjeÅ¡taja', 'error');
    }
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            container.removeChild(notification);
        }, 300);
    }, 5000);
}

window.selectCategory = selectCategory;
window.selectObligation = selectObligation;
window.downloadEvidence = downloadEvidence;
window.deleteEvidence = deleteEvidence;