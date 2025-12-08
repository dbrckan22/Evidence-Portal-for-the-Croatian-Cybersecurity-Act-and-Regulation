const API_URL = "http://localhost:5059/api/v1";

let categories = [];
let selectedCategoryId = null;
let obligations = [];
let userId = null; // login sesija

document.addEventListener("DOMContentLoaded", () => {
    // je li logged in
    userId = sessionStorage.getItem('userId');
    if (!userId) {
        // redirekt ak nije autentificiran
        // window.location.href = '/index.html';
        userId = 1; // za test, inace ovog nema
    }

    loadCategories();
    setupEventListeners();
});

// event listeners
function setupEventListeners() {
    const uploadForm = document.getElementById('upload-form');
    uploadForm.addEventListener('submit', handleFormSubmit);

    const logoutButton = document.getElementById('logout-button');
    logoutButton.addEventListener('click', handleLogout);

    const exportButton = document.getElementById('export-button');
    exportButton.addEventListener('click', handleExport);
}

// load kategorije s api
async function loadCategories() {
    const categoriesList = document.getElementById('categories-list');
    
    try {
        categoriesList.innerHTML = '<div class="loading-message">Učitavanje kategorija...</div>';
        
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
                Greška pri učitavanju kategorija.<br>
                Provjerite je li backend pokrenut.
            </div>
        `;
        showNotification('Greška pri učitavanju kategorija: ' + error.message, 'error');
    }
}

// prikaz kategorija
function renderCategories(categoriesData) {
    const categoriesList = document.getElementById('categories-list');
    
    categoriesList.innerHTML = categoriesData.map(category => {
        // izracun progressa
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

// select kategorije
async function selectCategory(categoryId) {
    selectedCategoryId = categoryId;
    
    // update UI
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('selected');
    });
    document.querySelector(`[data-category-id="${categoryId}"]`).classList.add('selected');
    
    // load obligations za kategoriju
    await loadObligations(categoryId);
}

// load obligations za odabranu kategroriju
async function loadObligations(categoryId) {
    const obligationSelect = document.getElementById('obligation-select');
    
    try {
        obligationSelect.innerHTML = '<option value="">Učitavanje obveza...</option>';
        
        const response = await fetch(`${API_URL}/categories/${categoryId}/obligations`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        obligations = await response.json();
        
        if (obligations.length === 0) {
            obligationSelect.innerHTML = '<option value="">Nema dostupnih obveza</option>';
            return;
        }
        
        obligationSelect.innerHTML = '<option value="">Odaberite obvezu...</option>' + 
            obligations.map(obligation => 
                `<option value="${obligation.obligationId || obligation.id}">
                    ${obligation.title || obligation.name}
                </option>`
            ).join('');
        
    } catch (error) {
        console.error('Error loading obligations:', error);
        obligationSelect.innerHTML = '<option value="">Greška pri učitavanju obveza</option>';
        showNotification('Greška pri učitavanju obveza: ' + error.message, 'error');
    }
}

// handle horm submit za evidence
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData();
    
    // get form values
    const obligationId = document.getElementById('obligation-select').value;
    const evidenceType = document.getElementById('evidence-type').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const file = document.getElementById('file').files[0];
    const linkUrl = document.getElementById('link').value;
    const responsible = document.getElementById('responsible').value;
    const validFrom = document.getElementById('valid-from').value;
    const validUntil = document.getElementById('valid-until').value;
    
    // validacija
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
    
    // prepare data za api
    const evidenceData = {
        obligationId: parseInt(obligationId),
        userId: parseInt(userId),
        evidenceType: evidenceType,
        title: title,
        note: description
    };
    
    // optional fields
    if (linkUrl) evidenceData.linkUrl = linkUrl;
    if (validFrom) evidenceData.validFrom = new Date(validFrom).toISOString();
    if (validUntil) evidenceData.validUntil = new Date(validUntil).toISOString();
    
    // ako postoji, poslati kao multipart/form-data
    if (file) {
        // append all fields to FormData
        Object.keys(evidenceData).forEach(key => {
            formData.append(key, evidenceData[key]);
        });
        formData.append('file', file);
        
        await uploadWithFile(formData);
    } else {
        // send as JSON if no file
        await uploadWithoutFile(evidenceData);
    }
}

// upload evidence s file
async function uploadWithFile(formData) {
    try {
        const response = await fetch(`${API_URL}/evidence/upload`, {
            method: 'POST',
            body: formData
            // ne! Content-Type header
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Upload failed');
        }
        
        const result = await response.json();
        
        showNotification('Dokaz uspješno uploadan!', 'success');
        
        // reset form
        document.getElementById('upload-form').reset();
        
        // reload kategorije za update
        loadCategories();
        
        // ako je kategorija odabrana, reload obveze
        if (selectedCategoryId) {
            loadObligations(selectedCategoryId);
        }
        
    } catch (error) {
        console.error('Error uploading evidence:', error);
        showNotification('Greška pri uploadu: ' + error.message, 'error');
    }
}

// upload evidence bez file (URL only)
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
        
        showNotification('Dokaz uspješno uploadan!', 'success');
        
        // reset form
        document.getElementById('upload-form').reset();
        
        // reload 
        loadCategories();
        
        // reload obligations
        if (selectedCategoryId) {
            loadObligations(selectedCategoryId);
        }
        
    } catch (error) {
        console.error('Error uploading evidence:', error);
        showNotification('Greška pri uploadu: ' + error.message, 'error');
    }
}

// handle logout
function handleLogout() {
    sessionStorage.clear();
    window.location.href = '/index.html';
}

// handle export
async function handleExport() {
    try {
        showNotification('Izvještaj se generira...', 'info');
        
        // TODO: kad se doda export
        // call export API endpoint
        // const response = await fetch(`${API_URL}/reports/export`, {
        //    method: 'GET'
        // });
        
        if (!response.ok) {
            throw new Error('Export failed');
        }
        
        // download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification('Izvještaj uspješno preuzet!', 'success');
        
    } catch (error) {
        console.error('Error exporting report:', error);
        showNotification('Greška pri exportu izvještaja', 'error');
    }
}

// notification
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // makni nakon 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            container.removeChild(notification);
        }, 300);
    }, 5000);
}

// selectCategory global
window.selectCategory = selectCategory;