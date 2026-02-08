// ===== CONFIGURATION =====
// CHANGE THIS URL WHEN DEPLOYING BACKEND
// For local development: http://localhost:5000
// For production: https://your-backend.com
const BACKEND_URL = 'https://team-section-admin-panel-production.up.railway.app';

// Frontend Admin Password (for login screen)
const FRONTEND_PASSWORD = "aliraza123";

// Global Variables
let selectedImageFile = null;
let imagePreviewUrl = null;
let adminPassword = FRONTEND_PASSWORD;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    setupEventListeners();
    setupDragAndDrop();
    checkBackendStatus();
});

// ===== BACKEND STATUS CHECK =====
async function checkBackendStatus() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/health`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('backendStatus').innerHTML = 
                '<span class="text-success">✓ Connected</span>';
            document.getElementById('databaseStatus').innerHTML = 
                `<span class="text-success">✓ ${data.jsonbin}</span>`;
            document.getElementById('apiStatus').textContent = '✓';
            document.getElementById('apiStatus').className = 'stat-number text-success';
        }
    } catch (error) {
        document.getElementById('backendStatus').innerHTML = 
            '<span class="text-danger">✗ Not Connected</span>';
        document.getElementById('databaseStatus').innerHTML = 
            '<span class="text-danger">✗ Error</span>';
        document.getElementById('apiStatus').textContent = '✗';
        document.getElementById('apiStatus').className = 'stat-number text-danger';
        console.log('Backend not running. Please start backend server first.');
    }
}

// ===== LOGIN FUNCTIONS =====
function checkLoginStatus() {
    if (localStorage.getItem('teamAdminLoggedIn') === 'true') {
        showAdminPanel();
        loadTeamMembers();
    }
}

function login() {
    const password = document.getElementById('loginPassword').value;
    const loginError = document.getElementById('loginError');
    
    if (password === FRONTEND_PASSWORD) {
        localStorage.setItem('teamAdminLoggedIn', 'true');
        showAdminPanel();
        loadTeamMembers();
        showAlert('success', 'Login successful! Welcome to Team Admin Panel.', 3000);
    } else {
        loginError.style.display = 'block';
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginPassword').focus();
    }
}

function showAdminPanel() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
}

function logout() {
    localStorage.removeItem('teamAdminLoggedIn');
    location.reload();
}

// ===== IMAGE UPLOAD FUNCTIONS =====
function setupDragAndDrop() {
    const uploadArea = document.getElementById('imageUploadArea');
    
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function() {
        this.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            handleImageFile(file);
        }
    });
}

function handleImageUpload(event) {
    if (event.target.files.length > 0) {
        const file = event.target.files[0];
        handleImageFile(file);
    }
}

function handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
        showAlert('danger', 'Please select an image file (JPG, PNG, GIF)');
        return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
        showAlert('danger', 'Image size should be less than 2MB');
        return;
    }
    
    selectedImageFile = file;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        imagePreviewUrl = e.target.result;
        const preview = document.getElementById('imagePreview');
        const uploadContent = document.getElementById('uploadContent');
        
        preview.src = imagePreviewUrl;
        preview.style.display = 'block';
        uploadContent.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// ===== FORM FUNCTIONS =====
function setupEventListeners() {
    // Enter key support
    document.getElementById('loginPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
    });
    
    document.getElementById('memberName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') document.getElementById('memberRole').focus();
    });
    
    document.getElementById('memberRole').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') document.getElementById('memberPortfolio').focus();
    });
    
    document.getElementById('memberPortfolio').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTeamMember();
    });
}

async function addTeamMember() {
    const name = document.getElementById('memberName').value.trim();
    const role = document.getElementById('memberRole').value.trim();
    const portfolio = document.getElementById('memberPortfolio').value.trim();
    
    if (!name || !role || !portfolio) {
        showAlert('danger', 'Please fill all required fields');
        return;
    }
    
    try {
        new URL(portfolio);
    } catch {
        showAlert('danger', 'Please enter a valid portfolio URL (include https://)');
        return;
    }
    
    const memberData = {
        name: name,
        role: role,
        portfolio: portfolio,
        password: adminPassword
    };
    
    if (imagePreviewUrl) {
        memberData.imageBase64 = imagePreviewUrl;
    }
    
    const addBtn = document.getElementById('addBtn');
    const addBtnText = document.getElementById('addBtnText');
    const addBtnSpinner = document.getElementById('addBtnSpinner');
    
    addBtn.disabled = true;
    addBtnText.style.display = 'none';
    addBtnSpinner.style.display = 'inline-block';
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/add-member`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(memberData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('success', data.message);
            clearForm();
            loadTeamMembers();
        } else {
            showAlert('danger', data.error || 'Failed to add member');
        }
    } catch (error) {
        showAlert('danger', 'Network error. Please check if backend is running.');
    } finally {
        addBtn.disabled = false;
        addBtnText.style.display = 'inline';
        addBtnSpinner.style.display = 'none';
    }
}

function clearForm() {
    document.getElementById('memberName').value = '';
    document.getElementById('memberRole').value = '';
    document.getElementById('memberPortfolio').value = '';
    
    const preview = document.getElementById('imagePreview');
    const uploadContent = document.getElementById('uploadContent');
    
    preview.style.display = 'none';
    uploadContent.style.display = 'block';
    selectedImageFile = null;
    imagePreviewUrl = null;
    document.getElementById('imageInput').value = '';
}

// ===== TEAM MEMBER FUNCTIONS =====
async function loadTeamMembers() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/team-members`);
        const data = await response.json();
        
        if (data.success) {
            displayMembers(data.team_members);
            updateStats(data.total, data.last_updated);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Error loading team:', error);
        showAlert('danger', 'Failed to load team members. Make sure backend is running.');
        displayEmptyState();
    }
}

function displayMembers(members) {
    const container = document.getElementById('membersList');
    
    if (!members || members.length === 0) {
        displayEmptyState();
        return;
    }
    
    let html = '';
    members.forEach(member => {
        html += `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="member-card">
                <img src="${member.image || 'https://via.placeholder.com/300x200/667eea/ffffff?text=Team+Member'}" 
                     class="member-img" 
                     alt="${member.name}"
                     onerror="this.src='https://via.placeholder.com/300x200/667eea/ffffff?text=Team+Member'">
                <div class="member-info">
                    <h5 class="member-name">${member.name}</h5>
                    <div class="member-role">
                        <i class="fas fa-briefcase"></i> ${member.role}
                    </div>
                    <a href="${member.portfolio}" 
                       target="_blank" 
                       class="member-portfolio mb-3">
                        <i class="fas fa-external-link-alt"></i> View Portfolio
                    </a>
                    <button onclick="deleteMember(${member.id}, '${member.name.replace(/'/g, "\\'")}')" 
                            class="btn btn-danger btn-sm w-100">
                        <i class="fas fa-trash me-2"></i> Delete
                    </button>
                </div>
            </div>
        </div>
        `;
    });
    
    container.innerHTML = html;
}

function displayEmptyState() {
    const container = document.getElementById('membersList');
    container.innerHTML = `
        <div class="col-12">
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h4 class="mt-3">No Team Members Yet</h4>
                <p class="text-muted">Add your first team member using the form</p>
            </div>
        </div>
    `;
}

async function deleteMember(memberId, memberName) {
    if (!confirm(`Are you sure you want to delete "${memberName}" from the team?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/delete-member/${memberId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: adminPassword })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('success', data.message);
            loadTeamMembers();
        } else {
            showAlert('danger', data.error || 'Failed to delete member');
        }
    } catch (error) {
        showAlert('danger', 'Network error. Please check backend connection.');
    }
}

// ===== UTILITY FUNCTIONS =====
function updateStats(total, lastUpdated) {
    document.getElementById('totalMembers').textContent = total;
    document.getElementById('membersCount').textContent = `${total} Member${total !== 1 ? 's' : ''}`;
    
    if (lastUpdated) {
        try {
            const date = new Date(lastUpdated);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            document.getElementById('lastUpdated').textContent = formattedDate;
        } catch {
            document.getElementById('lastUpdated').textContent = lastUpdated;
        }
    }
}

function refreshData() {
    loadTeamMembers();
    showAlert('info', 'Data refreshed successfully');
}

function showAlert(type, message, duration = 5000) {
    const toast = document.getElementById('alertToast');
    const toastIcon = document.getElementById('toastIcon');
    const toastMessage = document.getElementById('toastMessage');
    
    let iconClass = 'fas fa-info-circle';
    let borderColor = 'var(--primary)';
    
    switch(type) {
        case 'success':
            iconClass = 'fas fa-check-circle';
            borderColor = '#20c997';
            break;
        case 'danger':
            iconClass = 'fas fa-times-circle';
            borderColor = '#f72585';
            break;
        case 'warning':
            iconClass = 'fas fa-exclamation-triangle';
            borderColor = '#f8961e';
            break;
        case 'info':
            iconClass = 'fas fa-info-circle';
            borderColor = '#4361ee';
            break;
    }
    
    toastIcon.className = iconClass;
    toastMessage.textContent = message;
    toast.style.borderLeftColor = borderColor;
    toast.style.display = 'block';
    
    setTimeout(() => hideAlert(), duration);
}

function hideAlert() {
    document.getElementById('alertToast').style.display = 'none';
}

// Global functions for HTML
window.login = login;
window.logout = logout;
window.addTeamMember = addTeamMember;
window.deleteMember = deleteMember;
window.refreshData = refreshData;
window.clearForm = clearForm;
window.handleImageUpload = handleImageUpload;