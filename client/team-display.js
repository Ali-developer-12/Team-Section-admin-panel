// Team display for portfolio websites
const TEAM_API_URL = 'http://localhost:5000/api/team-members'; // Change to your backend URL

async function loadTeamForPortfolio(containerId = 'teamContainer') {
    try {
        const response = await fetch(TEAM_API_URL);
        const data = await response.json();
        
        if (data.success && data.team_members) {
            displayTeamInPortfolio(data.team_members, containerId);
        }
    } catch (error) {
        console.error('Error loading team:', error);
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="team-error text-center py-5">
                    <i class="fas fa-users fa-3x text-muted mb-3"></i>
                    <p>Team members will be displayed here soon.</p>
                </div>
            `;
        }
    }
}

function displayTeamInPortfolio(members, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let html = `
    <div class="team-section">
        <h2 class="text-center mb-5">Our Team</h2>
        <div class="row">
    `;
    
    members.forEach(member => {
        html += `
        <div class="col-md-4 col-lg-3 mb-4">
            <div class="card h-100 border-0 shadow-sm">
                <img src="${member.image || 'https://via.placeholder.com/300x300/667eea/ffffff?text=Team'}" 
                     class="card-img-top rounded-circle mx-auto mt-3" 
                     style="width: 120px; height: 120px; object-fit: cover;"
                     alt="${member.name}">
                <div class="card-body text-center">
                    <h5 class="card-title">${member.name}</h5>
                    <p class="card-text text-muted">${member.role}</p>
                    <a href="${member.portfolio}" 
                       target="_blank" 
                       class="btn btn-primary btn-sm">
                        <i class="fas fa-external-link-alt me-1"></i> Portfolio
                    </a>
                </div>
            </div>
        </div>
        `;
    });
    
    html += `
        </div>
    </div>
    `;
    
    container.innerHTML = html;
}

// Auto-load when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        if (document.getElementById('teamContainer')) {
            loadTeamForPortfolio();
        }
    });
} else {
    if (document.getElementById('teamContainer')) {
        loadTeamForPortfolio();
    }
}