const API_URL = "http://localhost:5059/api/v1";

let categories = [];
let selectedCategoryId = null;
let obligations = [];
let selectedObligationId = null;
let userId = null;
let organizationId = null;

const exportModal = document.getElementById('export-modal');
const generateExportButton = document.getElementById('generate-export');
const cancelExportButton = document.getElementById('cancel-export');
const closeExportButton = exportModal.querySelector('.close-button');

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
    loadObligationsForDropdown();
    setupEventListeners();
});

function setupEventListeners() {
    const uploadForm = document.getElementById('upload-form');
    uploadForm.addEventListener('submit', handleFormSubmit);

    const logoutButton = document.getElementById('logout-button');
    logoutButton.addEventListener('click', handleLogout);

    const exportButton = document.getElementById('export-button');
    exportButton.addEventListener('click', async () => {
        await renderExportCategories(); 
        setupExportCategoryButtons();
        exportModal.style.display = 'block'; 
    });


    generateExportButton.addEventListener('click', async () => {
        const checkedCategoryInputs = document.querySelectorAll('#export-categories input[type="checkbox"]:checked');
        const categoryIds = Array.from(checkedCategoryInputs).map(input => parseInt(input.value));

        if (categoryIds.length === 0) {
            showNotification('Molimo odaberite barem jednu kategoriju', 'error');
            return;
        }

        const includeExpired = document.getElementById('include-expired').checked;
        const includeMetadata = document.getElementById('include-metadata').checked;

        await exportReport(categoryIds, includeExpired, includeMetadata);

        exportModal.style.display = 'none';
    });

    cancelExportButton.addEventListener('click', () => exportModal.style.display = 'none');
    closeExportButton.addEventListener('click', () => exportModal.style.display = 'none');

    window.addEventListener('click', (e) => {
        if (e.target === exportModal) {
            exportModal.style.display = 'none';
        }
    });


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
        categoriesList.innerHTML = '<div class="loading-message">Ucitavanje kategorija...</div>';
        
        const response = await fetch(`${API_URL}/compliance/categories?organizationId=${organizationId}`);
        
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
                Greška pri učitavanju kategorija.<br>
                Provjerite je li backend pokrenut.
            </div>
        `;
        showNotification('Greška pri učitavanju kategorija: ' + error.message, 'error');
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


async function loadObligationsForDropdown() {
    try {
        const response = await fetch(`${API_URL}/compliance/tree`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const categoriesWithObligations = await response.json();
        
        renderObligationsDropdown(categoriesWithObligations);
        setupSearchableSelect();
        
    } catch (error) {
        console.error('Error loading obligations for dropdown:', error);
    }
}

function renderObligationsDropdown(categoriesData) {
    const obligationSelect = document.getElementById('obligation-select');
    
    obligationSelect.innerHTML = '<option value="">Odaberite obvezu...</option>';
    
    categoriesData.forEach(category => {
        if (category.obligations && category.obligations.length > 0) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = category.name;
            
            category.obligations.forEach(obligation => {
                const option = document.createElement('option');
                option.value = obligation.obligationId;
                option.textContent = obligation.title;
                option.setAttribute('data-category', category.name);
                optgroup.appendChild(option);
            });
            
            obligationSelect.appendChild(optgroup);
        }
    });
}

function setupSearchableSelect() {
    const obligationSelect = document.getElementById('obligation-select');
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'form-input obligation-search';
    searchInput.placeholder = 'Pretražite obveze...';
    searchInput.id = 'obligation-search';
    
    obligationSelect.parentElement.insertBefore(searchInput, obligationSelect);
    
    obligationSelect.size = 8;
    obligationSelect.style.display = 'none';
    
    let allOptions = Array.from(obligationSelect.querySelectorAll('option:not([value=""])'));
    
    searchInput.addEventListener('focus', () => {
        obligationSelect.style.display = 'block';
    });
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        obligationSelect.querySelectorAll('optgroup').forEach(optgroup => {
            optgroup.remove();
        });
        
        obligationSelect.innerHTML = '<option value="">Odaberite obvezu...</option>';
        
        const categoriesMap = new Map();
        
        allOptions.forEach(option => {
            const text = option.textContent.toLowerCase();
            const category = option.getAttribute('data-category');
            
            if (text.includes(searchTerm)) {
                if (!categoriesMap.has(category)) {
                    categoriesMap.set(category, []);
                }
                categoriesMap.get(category).push(option.cloneNode(true));
            }
        });
        
        categoriesMap.forEach((options, categoryName) => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = categoryName;
            options.forEach(option => optgroup.appendChild(option));
            obligationSelect.appendChild(optgroup);
        });
        
        if (categoriesMap.size > 0) {
            obligationSelect.style.display = 'block';
        }
    });
    
    obligationSelect.addEventListener('change', (e) => {
        const selectedOption = obligationSelect.options[obligationSelect.selectedIndex];
        if (selectedOption && selectedOption.value) {
            searchInput.value = selectedOption.textContent;
            obligationSelect.style.display = 'none';
        }
    });
    
    obligationSelect.addEventListener('click', (e) => {
        if (e.target.tagName === 'OPTION' && e.target.value) {
            searchInput.value = e.target.textContent;
            obligationSelect.value = e.target.value;
            obligationSelect.style.display = 'none';
        }
    });
    
    document.addEventListener('click', (e) => {
        if (e.target !== searchInput && e.target !== obligationSelect && !obligationSelect.contains(e.target)) {
            obligationSelect.style.display = 'none';
        }
    });
}
function renderCategories(categoriesData) {
    const categoriesList = document.getElementById('categories-list');
    
    categoriesList.innerHTML = categoriesData.map(category => {
        const completedCount = category.summary?.coveredObligations || 0;
        const totalCount = category.summary?.totalObligations || 0;
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
                        <span class="category-name">${category.categoryName || category.name}</span>
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
        obligationsList.innerHTML = '<div class="loading-message">Učitavanje obveza...</div>';
        
        const response = await fetch(`${API_URL}/categories/${categoryId}/obligations`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        obligations = await response.json();
        
        showObligationsView();
        renderObligations(obligations);
        
    } catch (error) {
        console.error('Error loading obligations:', error);
        obligationsList.innerHTML = '<div class="empty-state">Greška pri učitavanju obveza</div>';
        showNotification('Greška pri učitavanju obveza: ' + error.message, 'error');
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
        evidenceList.innerHTML = '<div class="loading-message">Učitavanje dokaza...</div>';
        
        const response = await fetch(`${API_URL}/evidence/obligation/${obligationId}?organizationId=${organizationId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const evidence = await response.json();
        
        showEvidenceView();
        renderEvidence(evidence);
        
    } catch (error) {
        console.error('Error loading evidence:', error);
        evidenceList.innerHTML = '<div class="empty-state">Greška pri učitavanju dokaza</div>';
        showNotification('Greška pri učitavanju dokaza: ' + error.message, 'error');
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
                <p style="font-size: 0.75rem; margin-top: 8px;">Koristite <a href="dashboard.html" class="upload-link">Upload formu</a> za dodavanje dokaza</p>
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
                statusText = `Ističe za ${daysUntilExpiry} dana`;
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
                        Obriši
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
        const evidence = (await fetch(`${API_URL}/evidence/obligation/${selectedObligationId}?organizationId=${organizationId}`)
            .then(res => res.json()))
            .find(e => e.evidenceId === evidenceId);

        if (!evidence) throw new Error("Dokaz nije pronađen");

        if (evidence.evidenceType === 'link') {
            window.open(evidence.linkUrl, '_blank');
            return;
        }

        const response = await fetch(`${API_URL}/evidence/download/${evidenceId}?organizationId=${organizationId}`);

        if (!response.ok) throw new Error('Greška pri preuzimanju');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        let filename = evidence.fileName || 'dokument';
        if (!filename.includes('.')) {
            switch (evidence.evidenceType) {
                case 'document':
                case 'config':
                case 'attestation':
                    filename += '.pdf';
                    break;
                case 'screenshot':
                    filename += '.png';
                    break;
            }
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showNotification('Dokument uspješno preuzet', 'success');
    } catch (error) {
        console.error('Error downloading evidence:', error);
        showNotification('Greška pri preuzimanju dokumenta', 'error');
    }
}

function getDownloadFileName(evidence) {
    const category = categories.find(c => c.categoryId === selectedCategoryId);
    const categoryName = category ? category.categoryName.replace(/[^a-zA-Z0-9 \-]/g, '').trim() : 'Kategorija';

    let fileName = evidence.fileName || evidence.title || 'dokument';
    if (fileName.includes('_')) {
        fileName = fileName.split('_').slice(1).join('_'); 
    }
    fileName = fileName.replace(/[^a-zA-Z0-9 \-_.]/g, '').trim();

    const hasExt = /\.[a-z0-9]+$/i.test(fileName);
    if (!hasExt) {
        switch (evidence.evidenceType) {
            case 'document':
            case 'config':
            case 'attestation':
                fileName += '.pdf';
                break;
            case 'screenshot':
                fileName += '.png';
                break;
        }
    }

    return `${categoryName}_${fileName}`;
}

async function deleteEvidence(evidenceId) {
    if (!confirm('Jeste li sigurni da zelite obrisati ovaj dokaz?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/evidence/${evidenceId}?organizationId=${organizationId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Greška pri brisanju');
        }

        showNotification('Dokaz uspješno obrisan', 'success');

        await loadEvidence(selectedObligationId);
        await loadComplianceSummary();
        await loadCategories();  
        if (selectedCategoryId) {
            await loadObligations(selectedCategoryId);
        }
        
    } catch (error) {
        console.error('Error deleting evidence:', error);
        showNotification('Greška pri brisanju dokaza', 'error');
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
    
    console.log('Form submission:', {
        obligationId,
        userId,
        organizationId,
        evidenceType,
        title,
        hasFile: !!file,
        linkUrl
    });
    
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
        ObligationId: parseInt(obligationId),
        UserId: parseInt(userId),
        EvidenceType: evidenceType,
        Title: title,
        Note: description
    };
    
    if (linkUrl) evidenceData.LinkUrl = linkUrl;
    if (validFrom) evidenceData.ValidFrom = new Date(validFrom).toISOString();
    if (validUntil) evidenceData.ValidUntil = new Date(validUntil).toISOString();
    
    if (file) {
        Object.keys(evidenceData).forEach(key => {
            formData.append(key, evidenceData[key]);
        });
        formData.append('File', file);
        
        await uploadWithFile(formData);
    } else {
        await uploadWithoutFile(evidenceData);
    }
}

async function uploadWithFile(formData) {
    try {
        const response = await fetch(`${API_URL}/evidence/evidence/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Upload failed');
        }
        
        const result = await response.json();
        
        showNotification('Dokaz uspješno uploadan!', 'success');
        
        document.getElementById('upload-form').reset();
        const searchInput = document.getElementById("obligation-search");
        if (searchInput) searchInput.value = "";
        
        loadCategories();
        loadComplianceSummary();
        
        if (selectedCategoryId) {
            loadObligations(selectedCategoryId);
        }
        
    } catch (error) {
        console.error('Error uploading evidence:', error);
        showNotification('Greška pri uploadu: ' + error.message, 'error');
    }
}

async function uploadWithoutFile(evidenceData) {
    try {
        const response = await fetch(`${API_URL}/evidence/evidence/upload`, {
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
        
        showNotification('Dokaz uspješno uploadan!', 'success');
        
        document.getElementById('upload-form').reset();
        const searchInput = document.getElementById("obligation-search");
        if (searchInput) searchInput.value = "";
        
        loadCategories();
        loadComplianceSummary();
        
        if (selectedCategoryId) {
            loadObligations(selectedCategoryId);
        }
        
    } catch (error) {
        console.error('Error uploading evidence:', error);
        showNotification('Greška pri uploadu: ' + error.message, 'error');
    }
}

function handleLogout() {
    sessionStorage.clear();
    window.location.href = 'index.html';
}

async function handleExport() {
    try {
        showNotification('Izvjestaj se generira...', 'info');
        
        showNotification('Export funkcionalnost jos nije implementirana', 'info');
        
    } catch (error) {
        console.error('Error exporting report:', error);
        showNotification('Greška pri exportu izvjestaja', 'error');
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

async function renderExportCategories() {
    const container = document.getElementById('export-categories');
    container.innerHTML = '<p>Učitavanje kategorija...</p>';

    try {
        const response = await fetch(`${API_URL}/compliance/categories?organizationId=${organizationId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const categoriesData = await response.json();

        if (categoriesData.length === 0) {
            container.innerHTML = '<p>Nema dostupnih kategorija za export</p>';
            return;
        }

        container.innerHTML = categoriesData.map(cat => `
            <div class="export-category-card">
                <label class="export-category-label">
                    <input type="checkbox" checked style="width: 14px; height: 14px;" value="${cat.categoryId}">
                    <span class="category-name">${cat.categoryName || cat.name}</span>
                </label>
                <div class="category-info">
                    ${cat.summary?.totalObligations || 0} obveza • ${cat.summary?.coveredObligations || 0} dokaza
                </div>
            </div>
        `).join('');

        } catch (error) {
            console.error('Greška pri učitavanju kategorija za export:', error);
            container.innerHTML = `<p style="color:red;">Greška pri učitavanju kategorija.</p>`;
        }
    }

async function exportReport(categoryIds, includeExpired, includeMetadata) {
    try {
        showNotification('Izvještaj se generira...', 'info');

        const response = await fetch(`${API_URL}/evidence/export`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: parseInt(userId),     
                organizationId: parseInt(organizationId),
                categoryIds,
                includeExpired,
                includeMetadata
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Greška pri generiranju izvještaja: ${response.status} ${errorText}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audit_report.zip'; 
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showNotification('Izvještaj je preuzet', 'success');

    } catch (error) {
        console.error(error);
        showNotification(error.message, 'error');
    }
}

function setupExportCategoryButtons() {
    const selectAllBtn = document.getElementById('select-all-categories');
    const deselectAllBtn = document.getElementById('deselect-all-categories');

    selectAllBtn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('#export-categories input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = true);
        updateExportSummary();
    });

    deselectAllBtn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('#export-categories input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
        updateExportSummary();
    });

    const checkboxes = document.querySelectorAll('#export-categories input[type="checkbox"]');
    checkboxes.forEach(cb => cb.addEventListener('change', updateExportSummary));

    updateExportSummary();
}

function updateExportSummary() {
    const checkboxes = document.querySelectorAll('#export-categories input[type="checkbox"]');
    const checkedBoxes = Array.from(checkboxes).filter(cb => cb.checked);
    const totalCategories = checkboxes.length;

    let totalObligations = 0;
    let totalEvidence = 0;

    checkedBoxes.forEach(cb => {
        const card = cb.closest('.export-category-card');
        const infoText = card.querySelector('.category-info').textContent;
        const match = infoText.match(/(\d+)\s+obveza\s*•\s*(\d+)\s+dokaza/);
        if (match) {
            totalObligations += parseInt(match[1]);
            totalEvidence += parseInt(match[2]);
        }
    });

    document.getElementById('summary-categories').textContent = `${checkedBoxes.length}/${totalCategories}`;
    document.getElementById('summary-obligations').textContent = totalObligations;
    document.getElementById('summary-evidence').textContent = totalEvidence;
}

window.selectCategory = selectCategory;
window.selectObligation = selectObligation;
window.downloadEvidence = downloadEvidence;
window.deleteEvidence = deleteEvidence;