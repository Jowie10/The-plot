// ============================================
// THE PLOT UG - ADMIN SCRIPT
// Complete with all admin features
// ============================================

// Global variables
let currentDraft = null;
let checklistComplete = false;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    const dateInput = document.getElementById('eventDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        dateInput.min = today;
    }
    
    // Initialize preview
    updatePreview();
    
    // Load drafts
    loadDrafts();
    
    // Update analytics
    updateAdminStats();
    
    // Add input listeners for preview
    setupPreviewListeners();
    
    // Make mobile friendly
    makeMobileFriendly();
});

// ============================================
// FORM SUBMISSION
// ============================================

document.getElementById('eventForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Check if checklist is complete
    if (!checklistComplete) {
        showNotification('Please complete the pre-publish checklist first', 'error');
        return;
    }

    // Get form values
    const eventData = {
        id: Date.now(),
        title: document.getElementById('eventTitle').value,
        category: document.getElementById('eventCategory').value,
        venue: document.getElementById('eventVenue').value,
        location: document.getElementById('eventLocation').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        price: document.getElementById('eventPrice').value,
        activities: document.getElementById('eventActivities').value,
        contact: document.getElementById('eventContact').value,
        ticketLink: document.getElementById('eventTicketLink').value,
        poster: document.getElementById('eventPoster').value,
        additional: document.getElementById('eventAdditional').value,
        featured: document.getElementById('eventFeatured').value === 'true',
        promoCode: document.getElementById('eventPromoCode').value,
        views: 0,
        saves: 0,
        createdAt: new Date().toISOString()
    };

    // Validate required fields
    if (!eventData.title || !eventData.category || !eventData.venue || 
        !eventData.location || !eventData.date || !eventData.time || 
        !eventData.price || !eventData.activities || !eventData.poster) {
        
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    // Get existing events
    let events = JSON.parse(localStorage.getItem('ugEvents')) || [];
    
    // Add new event
    events.push(eventData);
    
    // Save to localStorage
    localStorage.setItem('ugEvents', JSON.stringify(events));

    // Show success popup
    showSuccessPopup();
});

// ============================================
// PRE-PUBLISH CHECKLIST
// ============================================

function updateChecklist() {
    const checkboxes = document.querySelectorAll('.checklist-checkbox');
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    const progress = document.getElementById('checklistProgress');
    const message = document.getElementById('checklistMessage');
    const publishBtn = document.getElementById('publishBtn');
    
    // Update progress bar
    progress.value = checkedCount;
    
    // Update message
    if (checkedCount === 6) {
        message.innerHTML = '✅ Ready to publish!';
        message.style.color = '#10b981';
        checklistComplete = true;
    } else {
        message.innerHTML = `⚠️ ${6 - checkedCount} items remaining`;
        message.style.color = '#ef4444';
        checklistComplete = false;
    }
}

// ============================================
// TEMPLATES
// ============================================

function loadTemplate(type) {
    const templates = {
        club: {
            title: 'Club Night at ________',
            category: 'Nightlife',
            time: '10:00 PM - Late',
            price: '30,000',
            activities: 'DJ ________\nGuest DJ\nHappy hour 10-11pm\nLadies free before 11\nShisha lounge',
            additional: 'Strictly 18+ | VIP tables available | Free parking'
        },
        brunch: {
            title: 'Sunday Brunch at ________',
            category: 'Brunch',
            time: '12:00 PM - 4:00 PM',
            price: '65,000',
            activities: 'Bottomless mimosas\nLive acoustic music\nBrunch buffet\nFresh juice bar\nPastry station',
            additional: 'Kids under 12 half price | Reservations recommended'
        },
        concert: {
            title: 'Live in Concert: ________',
            category: 'Live Music',
            time: '7:00 PM - Late',
            price: '50,000',
            activities: 'Opening act\nMain performance\nMeet & greet (VIP)\nMerchandise booth',
            additional: 'Gates open at 5pm | VIP tickets available'
        },
        family: {
            title: 'Family Fun Day at ________',
            category: 'Family',
            time: '10:00 AM - 6:00 PM',
            price: '20,000',
            activities: 'Bouncy castles\nFace painting\nMagic show\nGames\nPicnic area',
            additional: 'Kids under 3 free | Bring your own picnic'
        },
        breakfast: {
            title: 'Breakfast at ________',
            category: 'Breakfast',
            time: '7:00 AM - 11:00 AM',
            price: '25,000',
            activities: 'Full English breakfast\nUnlimited tea/coffee\nFresh juice\nPastries',
            additional: 'Takeaway available | Outdoor seating'
        },
        afterparty: {
            title: 'Official After Party: ________',
            category: 'After Party',
            time: '2:00 AM - 7:00 AM',
            price: '40,000',
            activities: 'Secret DJ sets\nBreakfast included\nChill-out zone\nHookah lounge',
            additional: 'Entry before 3am | Strictly 21+'
        }
    };
    
    const template = templates[type];
    if (!template) return;
    
    // Fill in the form
    document.getElementById('eventTitle').value = template.title;
    document.getElementById('eventCategory').value = template.category;
    document.getElementById('eventTime').value = template.time;
    document.getElementById('eventPrice').value = template.price;
    document.getElementById('eventActivities').value = template.activities;
    document.getElementById('eventAdditional').value = template.additional;
    
    // Update preview
    updatePreview();
    
    showNotification(`Template loaded: ${type}`, 'success');
}

// ============================================
// LIVE PREVIEW
// ============================================

function setupPreviewListeners() {
    const fields = ['eventTitle', 'eventCategory', 'eventVenue', 'eventLocation', 
                   'eventDate', 'eventTime', 'eventPrice', 'eventPoster'];
    
    fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.addEventListener('input', updatePreview);
            element.addEventListener('change', updatePreview);
        }
    });
}

function updatePreview() {
    const preview = document.getElementById('livePreview');
    if (!preview) return;

    const title = document.getElementById('eventTitle').value || 'Event Title';
    const category = document.getElementById('eventCategory').value || 'Category';
    const venue = document.getElementById('eventVenue').value || 'Venue';
    const date = document.getElementById('eventDate').value || new Date().toISOString().split('T')[0];
    const time = document.getElementById('eventTime').value || 'Time';
    const price = document.getElementById('eventPrice').value || 'Price';
    const poster = document.getElementById('eventPoster').value || 'https://placehold.co/300x400?text=Preview';

    const formattedDate = new Date(date).toLocaleDateString('en-US', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
    });

    preview.innerHTML = `
        <div class="preview-card">
            <div class="poster-container">
                <img src="${poster}" alt="Preview" onerror="this.src='https://placehold.co/300x400?text=Preview'">
                <span class="tag">${category}</span>
                <span class="date-tag">${formattedDate}</span>
            </div>
            <div class="card-details">
                <h3>${title}</h3>
                <p class="venue"><i class="fas fa-map-marker-alt"></i> ${venue}</p>
                <p class="time"><i class="fas fa-clock"></i> ${time}</p>
                <p class="price">UGX ${price}</p>
            </div>
        </div>
    `;
}

// ============================================
// SUCCESS POPUP
// ============================================

function showSuccessPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'success-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <div class="popup-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h2>Event Published! 🎉</h2>
            <p>Your event has been successfully posted to The Plot UG.</p>
            <div class="popup-buttons">
                <a href="index.html" class="popup-btn primary">
                    <i class="fas fa-home"></i> Go to Home
                </a>
                <button onclick="postAnother()" class="popup-btn secondary">
                    <i class="fas fa-plus"></i> Post Another
                </button>
                <button onclick="viewEvent()" class="popup-btn secondary">
                    <i class="fas fa-eye"></i> View Event
                </button>
            </div>
        </div>
    `;
    
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    setTimeout(() => popup.classList.add('show'), 10);
}

function postAnother() {
    const overlay = document.querySelector('.popup-overlay');
    if (overlay) overlay.remove();
    
    // Reset form
    document.getElementById('eventForm').reset();
    
    // Reset date to today
    const dateInput = document.getElementById('eventDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
    
    // Reset checkboxes
    document.querySelectorAll('.checklist-checkbox').forEach(cb => cb.checked = false);
    updateChecklist();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function viewEvent() {
    // Get the last published event
    const events = JSON.parse(localStorage.getItem('ugEvents')) || [];
    if (events.length > 0) {
        const lastEvent = events[events.length - 1];
        window.location.href = `index.html?event=${lastEvent.id}`;
    } else {
        window.location.href = 'index.html';
    }
}

// ============================================
// DRAFT SYSTEM
// ============================================

function saveDraft() {
    const draft = {
        id: Date.now(),
        title: document.getElementById('eventTitle').value,
        category: document.getElementById('eventCategory').value,
        venue: document.getElementById('eventVenue').value,
        location: document.getElementById('eventLocation').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        price: document.getElementById('eventPrice').value,
        activities: document.getElementById('eventActivities').value,
        contact: document.getElementById('eventContact').value,
        ticketLink: document.getElementById('eventTicketLink').value,
        poster: document.getElementById('eventPoster').value,
        additional: document.getElementById('eventAdditional').value,
        featured: document.getElementById('eventFeatured').value,
        promoCode: document.getElementById('eventPromoCode').value
    };
    
    let drafts = JSON.parse(localStorage.getItem('eventDrafts')) || [];
    drafts.push(draft);
    localStorage.setItem('eventDrafts', JSON.stringify(drafts));
    
    showNotification('Draft saved successfully!', 'success');
    loadDrafts();
}

function loadDrafts() {
    const drafts = JSON.parse(localStorage.getItem('eventDrafts')) || [];
    const draftsSection = document.getElementById('draftsSection');
    const draftsList = document.getElementById('draftsList');
    
    if (drafts.length > 0) {
        draftsSection.style.display = 'block';
        draftsList.innerHTML = drafts.map(draft => `
            <div class="draft-item" onclick="loadDraft(${draft.id})">
                <div class="draft-info">
                    <strong>${draft.title || 'Untitled'}</strong>
                    <small>${new Date(draft.date || Date.now()).toLocaleDateString()}</small>
                </div>
                <button onclick="deleteDraft(${draft.id}, event)" class="delete-draft">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    } else {
        draftsSection.style.display = 'none';
    }
}

function loadDraft(draftId) {
    const drafts = JSON.parse(localStorage.getItem('eventDrafts')) || [];
    const draft = drafts.find(d => d.id === draftId);
    
    if (draft) {
        Object.keys(draft).forEach(key => {
            const element = document.getElementById(`event${key.charAt(0).toUpperCase() + key.slice(1)}`);
            if (element) {
                element.value = draft[key];
            }
        });
        
        updatePreview();
        showNotification('Draft loaded', 'success');
    }
}

function deleteDraft(draftId, event) {
    event.stopPropagation();
    
    let drafts = JSON.parse(localStorage.getItem('eventDrafts')) || [];
    drafts = drafts.filter(d => d.id !== draftId);
    localStorage.setItem('eventDrafts', JSON.stringify(drafts));
    
    loadDrafts();
    showNotification('Draft deleted', 'info');
}

// ============================================
// BULK UPLOAD
// ============================================

function handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csv = e.target.result;
        const events = parseCSV(csv);
        showBulkPreview(events);
    };
    reader.readAsText(file);
}

function parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    const events = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        const event = {};
        
        headers.forEach((header, index) => {
            event[header.trim()] = values[index]?.trim() || '';
        });
        
        events.push(event);
    }
    
    return events;
}

function showBulkPreview(events) {
    const previewDiv = document.createElement('div');
    previewDiv.className = 'bulk-preview';
    previewDiv.innerHTML = `
        <div class="bulk-preview-content">
            <h3>📋 Preview ${events.length} Events</h3>
            <div class="bulk-events-list">
                ${events.map((e, i) => `
                    <div class="bulk-event-item">
                        <strong>${i+1}. ${e.title || 'Untitled'}</strong>
                        <small>${e.venue || 'No venue'}</small>
                    </div>
                `).join('')}
            </div>
            <div class="bulk-actions">
                <button onclick="confirmBulkUpload(${JSON.stringify(events).replace(/"/g, '&quot;')})" class="submit-btn">
                    Upload All
                </button>
                <button onclick="closeBulkPreview()" class="cancel-btn">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(previewDiv);
}

function confirmBulkUpload(events) {
    const existingEvents = JSON.parse(localStorage.getItem('ugEvents')) || [];
    
    events.forEach(event => {
        const newEvent = {
            ...event,
            id: Date.now() + Math.random(),
            views: 0,
            saves: 0,
            createdAt: new Date().toISOString()
        };
        existingEvents.push(newEvent);
    });
    
    localStorage.setItem('ugEvents', JSON.stringify(existingEvents));
    
    closeBulkPreview();
    showNotification(`${events.length} events uploaded successfully!`, 'success');
    updateAdminStats();
}

function closeBulkPreview() {
    const preview = document.querySelector('.bulk-preview');
    if (preview) preview.remove();
}

function downloadSampleCSV(event) {
    event.preventDefault();
    
    const sample = `title,category,venue,location,date,time,price,activities,contact,poster
"Jazz Night","Band Night","Sky Lounge","Kololo","2024-04-15","8:00 PM","50,000","Live Jazz Band\\nCocktails","0700123456","https://example.com/poster.jpg"
"Sunday Brunch","Brunch","Pearl Hotel","Kampala","2024-04-16","11:00 AM","75,000","Buffet\\nLive Music","0701789012","https://example.com/brunch.jpg"`;
    
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_events.csv';
    a.click();
}

// ============================================
// ADMIN STATISTICS
// ============================================

function updateAdminStats() {
    const events = JSON.parse(localStorage.getItem('ugEvents')) || [];
    
    document.getElementById('totalEvents').textContent = events.length;
    
    const totalViews = events.reduce((sum, e) => sum + (e.views || 0), 0);
    document.getElementById('totalViews').textContent = totalViews;
    
    const totalSaves = events.reduce((sum, e) => sum + (e.saves || 0), 0);
    document.getElementById('totalSaves').textContent = totalSaves;
    
    const featuredCount = events.filter(e => e.featured).length;
    document.getElementById('featuredCount').textContent = featuredCount;
}

// ============================================
// NOTIFICATIONS
// ============================================

function showNotification(message, type) {
    const existingNotif = document.querySelector('.notification');
    if (existingNotif) existingNotif.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// MOBILE FRIENDLY
// ============================================

function makeMobileFriendly() {
    // Prevent zoom on input focus
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            document.body.style.fontSize = '16px';
        });
    });
    
    // Make checkboxes easier to tap
    document.querySelectorAll('.checklist-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (e.target.type !== 'checkbox') {
                const checkbox = this.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    updateChecklist();
                }
            }
        });
    });
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

window.loadTemplate = loadTemplate;
window.updateChecklist = updateChecklist;