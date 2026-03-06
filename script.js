// ============================================
// THE PLOT UG - MAIN SCRIPT
// Complete with all features
// ============================================

// Global Variables
let events = [];
let currentUser = null;
let savedEvents = [];
let viewedEvents = [];
let currentCategory = 'all';
let currentLocation = 'all';
let currentPriceFilter = '';
let currentDateFilter = '';
let searchTerm = '';

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadEvents();
    loadUserSession();
    loadSavedEvents();
    initEventListeners();
    checkForReminders();
    startCountdowns();
    updateScrollTopButton();
    makeMobileFriendly();
});

// ============================================
// EVENT LOADING & DISPLAY
// ============================================

function loadEvents() {
    showLoading();
    
    // Load from localStorage
    const saved = localStorage.getItem('ugEvents');
    events = saved ? JSON.parse(saved) : [];
    
    // Add sample data if empty
    if (events.length === 0) {
        addSampleEvents();
    }
    
    // Update analytics
    updateViewCounts();
    
    // Display events
    setTimeout(() => {
        hideLoading();
        displayEvents();
        updateEventCount();
    }, 500);
}

function addSampleEvents() {
    const sampleEvents = [
        {
            id: Date.now() + 1,
            title: "Smooth Jazz Night",
            category: "Band Night",
            venue: "Sky Lounge, Kololo",
            location: "Kololo",
            date: getFutureDate(1),
            time: "8:00 PM - Late",
            price: "50,000",
            activities: "Live band: The Jazz Collective\nSaxophone solos\nCocktail specials\nNetworking hour",
            contact: "0700 123456",
            ticketLink: "https://tickets.ug/jazz",
            poster: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
            additional: "Dress code: Smart casual | 18+",
            featured: true,
            views: 0,
            saves: 0
        },
        {
            id: Date.now() + 2,
            title: "Sunday Brunch Buffet",
            category: "Brunch",
            venue: "The Pearl Hotel, Kampala",
            location: "Kampala Central",
            date: getFutureDate(2),
            time: "11:00 AM - 3:00 PM",
            price: "75,000",
            activities: "International buffet\nLive cooking stations\nBottomless mimosas\nLive acoustic music",
            contact: "0701 789012",
            ticketLink: "",
            poster: "https://images.unsplash.com/photo-1555244162-803834f70033?w=800",
            additional: "Kids under 12: 35,000 | Family friendly",
            featured: false,
            views: 0,
            saves: 0
        },
        {
            id: Date.now() + 3,
            title: "AfroBeats After Party",
            category: "After Party",
            venue: "Club Vibe, Garden City",
            location: "Kampala Central",
            date: getFutureDate(0),
            time: "10:00 PM - 5:00 AM",
            price: "30,000",
            activities: "DJ Spinall\nAfroBeats vs Dancehall\nLadies free before 11\nShisha lounge",
            contact: "0772 345678",
            ticketLink: "https://tickets.ug/afrobeats",
            poster: "https://images.unsplash.com/photo-1571266028243-3716f02d2d2f?w=800",
            additional: "Strictly 18+ | VIP tables available",
            featured: true,
            views: 0,
            saves: 0
        }
    ];
    
    events = sampleEvents;
    saveEvents();
}

function getFutureDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

function saveEvents() {
    localStorage.setItem('ugEvents', JSON.stringify(events));
}

function displayEvents() {
    const grid = document.getElementById('vibeFeed');
    if (!grid) return;

    let filteredEvents = filterEvents();

    if (filteredEvents.length === 0) {
        grid.innerHTML = `
            <div class="no-events">
                <i class="fas fa-calendar-times"></i>
                <h3>No Events Found</h3>
                <p>Try adjusting your filters or check back later</p>
                <button onclick="resetFilters()" class="reset-filters-btn">
                    <i class="fas fa-redo"></i> Reset Filters
                </button>
                <a href="admin.html" class="add-event-link">Post an Event</a>
            </div>
        `;
        return;
    }

    // Sort featured events first
    filteredEvents.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return new Date(a.date) - new Date(b.date);
    });

    grid.innerHTML = filteredEvents.map(event => createEventCard(event)).join('');
    
    // Re-attach event listeners to cards
    attachCardListeners();
}

function filterEvents() {
    return events.filter(event => {
        // Category filter
        if (currentCategory !== 'all' && event.category !== currentCategory) {
            return false;
        }
        
        // Location filter
        if (currentLocation !== 'all' && event.location !== currentLocation) {
            return false;
        }
        
        // Price filter
        if (currentPriceFilter) {
            const price = parseInt(event.price.replace(/,/g, ''));
            if (currentPriceFilter === 'free' && price !== 0 && event.price.toLowerCase() !== 'free') return false;
            if (currentPriceFilter === 'under30k' && (price >= 30000 || isNaN(price))) return false;
            if (currentPriceFilter === '30k-50k' && (price < 30000 || price > 50000)) return false;
            if (currentPriceFilter === '50k-100k' && (price < 50000 || price > 100000)) return false;
            if (currentPriceFilter === 'over100k' && (price <= 100000 || isNaN(price))) return false;
        }
        
        // Date filter
        if (currentDateFilter) {
            const eventDate = new Date(event.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (currentDateFilter === 'today') {
                if (eventDate.toDateString() !== today.toDateString()) return false;
            } else if (currentDateFilter === 'tomorrow') {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                if (eventDate.toDateString() !== tomorrow.toDateString()) return false;
            } else if (currentDateFilter === 'weekend') {
                const day = eventDate.getDay();
                if (day !== 5 && day !== 6 && day !== 0) return false; // Fri, Sat, Sun
            } else if (currentDateFilter === 'next7') {
                const nextWeek = new Date(today);
                nextWeek.setDate(nextWeek.getDate() + 7);
                if (eventDate < today || eventDate > nextWeek) return false;
            }
        }
        
        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return event.title.toLowerCase().includes(term) ||
                   event.venue.toLowerCase().includes(term) ||
                   event.activities.toLowerCase().includes(term);
        }
        
        return true;
    });
}

function createEventCard(event) {
    const date = new Date(event.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
    });
    
    const isSaved = savedEvents.includes(event.id);
    const isFeatured = event.featured ? 'featured' : '';
    
    return `
        <div class="card ${isFeatured}" data-event-id="${event.id}" onclick="openEventDetails(${event.id})">
            <div class="poster-container">
                <img src="${event.poster}" alt="${event.title}" loading="lazy" onerror="this.src='https://placehold.co/300x400?text=No+Poster'">
                <span class="tag">${event.category}</span>
                <span class="date-tag">${formattedDate}</span>
                ${event.featured ? '<span class="featured-tag">🌟 Featured</span>' : ''}
                <button class="save-card-btn ${isSaved ? 'saved' : ''}" onclick="toggleSaveEvent(${event.id}, event)">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
            <div class="card-details">
                <h3>${event.title}</h3>
                <p class="venue"><i class="fas fa-map-marker-alt"></i> ${event.venue}</p>
                <p class="time"><i class="fas fa-clock"></i> ${event.time}</p>
                <p class="price">UGX ${event.price}</p>
                <div class="card-footer">
                    <span class="activities-preview">${event.activities.substring(0, 40)}...</span>
                    <div class="event-stats">
                        <span><i class="fas fa-eye"></i> ${event.views || 0}</span>
                        <span><i class="fas fa-heart"></i> ${event.saves || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function attachCardListeners() {
    // Card click handled by onclick in HTML
}

// ============================================
// EVENT DETAILS MODAL
// ============================================

function openEventDetails(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    // Increment view count
    event.views = (event.views || 0) + 1;
    saveEvents();

    // Add to viewed events
    if (!viewedEvents.includes(eventId)) {
        viewedEvents.push(eventId);
        localStorage.setItem('viewedEvents', JSON.stringify(viewedEvents));
    }

    const modal = document.getElementById('eventModal');
    const modalContent = document.getElementById('modalContent');
    const isSaved = savedEvents.includes(event.id);
    
    const date = new Date(event.date);
    const fullDate = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    modalContent.innerHTML = `
        <div class="event-detail">
            <div class="detail-poster">
                <img src="${event.poster}" alt="${event.title}">
                ${event.featured ? '<span class="featured-badge">🌟 FEATURED</span>' : ''}
            </div>
            <div class="detail-info">
                <div class="detail-header">
                    <h2>${event.title}</h2>
                    <p class="detail-category"><span class="badge">${event.category}</span></p>
                </div>
                
                <div class="countdown-timer" id="countdown-${event.id}"></div>
                
                <div class="detail-section">
                    <h4><i class="fas fa-info-circle"></i> Event Details</h4>
                    <p><i class="fas fa-map-marker-alt"></i> <strong>Venue:</strong> ${event.venue}</p>
                    <p><i class="fas fa-calendar"></i> <strong>Date:</strong> ${fullDate}</p>
                    <p><i class="fas fa-clock"></i> <strong>Time:</strong> ${event.time}</p>
                    <p><i class="fas fa-tag"></i> <strong>Price:</strong> UGX ${event.price}</p>
                </div>

                <div class="detail-section">
                    <h4><i class="fas fa-list"></i> Activities/Lineup</h4>
                    <p class="activities-list">${event.activities.replace(/\n/g, '<br>')}</p>
                </div>

                <div class="detail-section">
                    <h4><i class="fas fa-phone"></i> Contact</h4>
                    <p>${event.contact || 'Not provided'}</p>
                </div>

                ${event.additional ? `
                <div class="detail-section">
                    <h4><i class="fas fa-info"></i> Additional Info</h4>
                    <p>${event.additional}</p>
                </div>
                ` : ''}

                <div class="detail-stats">
                    <span><i class="fas fa-eye"></i> ${event.views || 0} views</span>
                    <span><i class="fas fa-heart"></i> ${event.saves || 0} saves</span>
                </div>

                <div class="detail-actions">
                    <button onclick="toggleSaveEvent(${event.id})" class="action-btn save-btn ${isSaved ? 'saved' : ''}">
                        <i class="fas ${isSaved ? 'fa-heart' : 'fa-heart'}"></i>
                        ${isSaved ? 'Saved' : 'Save Event'}
                    </button>
                    
                    <button onclick="setEventReminder(${event.id})" class="action-btn reminder-btn">
                        <i class="fas fa-bell"></i> Remind Me
                    </button>
                    
                    <button onclick="shareEvent(${event.id})" class="action-btn share-btn">
                        <i class="fas fa-share-alt"></i> Share
                    </button>
                    
                    ${event.ticketLink ? `
                    <a href="${event.ticketLink}" target="_blank" class="action-btn ticket-btn">
                        <i class="fas fa-ticket-alt"></i> Get Tickets
                    </a>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    
    // Start countdown for this event
    startSingleCountdown(event.id, event.date);
}

function closeEventModal() {
    document.getElementById('eventModal').style.display = 'none';
    document.body.classList.remove('modal-open');
}

// ============================================
// SAVED EVENTS FEATURE
// ============================================

function loadSavedEvents() {
    savedEvents = JSON.parse(localStorage.getItem('savedEvents')) || [];
    updateSavedCount();
}

function toggleSaveEvent(eventId, event) {
    if (event) {
        event.stopPropagation();
    }
    
    const index = savedEvents.indexOf(eventId);
    const eventObj = events.find(e => e.id === eventId);
    
    if (index === -1) {
        savedEvents.push(eventId);
        eventObj.saves = (eventObj.saves || 0) + 1;
        showNotification('Event saved to your list!', 'success');
    } else {
        savedEvents.splice(index, 1);
        eventObj.saves = Math.max(0, (eventObj.saves || 0) - 1);
        showNotification('Event removed from saved', 'info');
    }
    
    localStorage.setItem('savedEvents', JSON.stringify(savedEvents));
    saveEvents();
    updateSavedCount();
    displayEvents(); // Refresh display
    
    // Show saved toggle if there are saved events
    const savedToggle = document.getElementById('savedToggle');
    if (savedToggle) {
        savedToggle.style.display = savedEvents.length > 0 ? 'flex' : 'none';
    }
}

function updateSavedCount() {
    const countSpan = document.getElementById('savedCount');
    if (countSpan) {
        countSpan.textContent = savedEvents.length;
    }
}

function showSavedEvents() {
    if (savedEvents.length === 0) {
        showNotification('No saved events yet', 'info');
        return;
    }
    
    // Filter to show only saved events
    currentCategory = 'all';
    currentLocation = 'all';
    currentPriceFilter = '';
    currentDateFilter = '';
    searchTerm = '';
    
    const savedEventsList = events.filter(e => savedEvents.includes(e.id));
    
    const grid = document.getElementById('vibeFeed');
    grid.innerHTML = savedEventsList.map(event => createEventCard(event)).join('');
    
    // Update active category
    document.querySelectorAll('.chip').forEach(chip => {
        chip.classList.remove('active');
        if (chip.dataset.category === 'all') {
            chip.classList.add('active');
        }
    });
    
    showNotification('Showing your saved events', 'success');
}

// ============================================
// REMINDERS & NOTIFICATIONS
// ============================================

function setEventReminder(eventId) {
    if (!('Notification' in window)) {
        showNotification('Browser does not support notifications', 'error');
        return;
    }
    
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
            const eventTime = new Date(`${event.date}T${event.time.split(' ')[0]}`);
            const now = new Date();
            
            // Calculate reminder time (1 hour before event)
            const reminderTime = eventTime.getTime() - (60 * 60 * 1000);
            
            // Only set if event is in the future
            if (reminderTime > now.getTime()) {
                const reminders = JSON.parse(localStorage.getItem('eventReminders')) || [];
                reminders.push({
                    eventId: event.id,
                    eventTitle: event.title,
                    reminderTime: reminderTime
                });
                localStorage.setItem('eventReminders', JSON.stringify(reminders));
                
                showNotification('✓ Reminder set! We\'ll notify you 1 hour before', 'success');
            } else {
                showNotification('Cannot set reminder for past events', 'error');
            }
        }
    });
}

function checkForReminders() {
    const reminders = JSON.parse(localStorage.getItem('eventReminders')) || [];
    const now = new Date().getTime();
    
    reminders.forEach((reminder, index) => {
        if (reminder.reminderTime <= now && reminder.reminderTime > now - 3600000) {
            // Show notification
            if (Notification.permission === 'granted') {
                new Notification('🔔 Event Reminder', {
                    body: `${reminder.eventTitle} starts in 1 hour!`,
                    icon: '/icon.png'
                });
            }
            
            // Remove from reminders
            reminders.splice(index, 1);
        }
    });
    
    localStorage.setItem('eventReminders', JSON.stringify(reminders));
}

// ============================================
// COUNTDOWN TIMERS
// ============================================

function startCountdowns() {
    setInterval(() => {
        events.forEach(event => {
            const timerElement = document.getElementById(`countdown-${event.id}`);
            if (timerElement) {
                updateCountdown(event.id, event.date, timerElement);
            }
        });
    }, 1000);
}

function startSingleCountdown(eventId, eventDate) {
    const timerElement = document.getElementById(`countdown-${eventId}`);
    if (timerElement) {
        setInterval(() => {
            updateCountdown(eventId, eventDate, timerElement);
        }, 1000);
    }
}

function updateCountdown(eventId, eventDate, element) {
    const now = new Date().getTime();
    const eventTime = new Date(eventDate).getTime();
    const distance = eventTime - now;
    
    if (distance < 0) {
        element.innerHTML = 'Event has started!';
        element.classList.add('event-started');
        return;
    }
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    let countdownText = '';
    if (days > 0) countdownText += `${days}d `;
    if (hours > 0 || days > 0) countdownText += `${hours}h `;
    if (minutes > 0 || hours > 0 || days > 0) countdownText += `${minutes}m `;
    countdownText += `${seconds}s`;
    
    element.innerHTML = `⏰ Starts in: ${countdownText}`;
}

// ============================================
// SEARCH & FILTERS
// ============================================

function initEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            document.querySelector('.clear-search').style.display = searchTerm ? 'block' : 'none';
            applyFilters();
        });
    }
    
    // Category chips
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentCategory = chip.dataset.category;
            applyFilters();
        });
    });
}

function applyFilters() {
    currentPriceFilter = document.getElementById('priceFilter')?.value || '';
    currentDateFilter = document.getElementById('dateFilter')?.value || '';
    displayEvents();
    updateEventCount();
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        searchTerm = '';
        document.querySelector('.clear-search').style.display = 'none';
        applyFilters();
    }
}

function resetFilters() {
    currentCategory = 'all';
    currentLocation = 'all';
    currentPriceFilter = '';
    currentDateFilter = '';
    searchTerm = '';
    
    // Update UI
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    document.querySelector('[data-category="all"]').classList.add('active');
    
    const priceFilter = document.getElementById('priceFilter');
    if (priceFilter) priceFilter.value = '';
    
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) dateFilter.value = '';
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    document.querySelector('.clear-search').style.display = 'none';
    document.getElementById('locationText').textContent = 'All Kampala';
    
    displayEvents();
    showNotification('Filters reset', 'info');
}

function updateEventCount() {
    const count = document.getElementById('eventCount');
    if (count) {
        const visibleEvents = filterEvents().length;
        count.textContent = `${visibleEvents} events`;
    }
}

// ============================================
// LOCATION FILTER
// ============================================

function showLocationFilter() {
    document.getElementById('locationModal').style.display = 'block';
    document.body.classList.add('modal-open');
}

function closeLocationModal() {
    document.getElementById('locationModal').style.display = 'none';
    document.body.classList.remove('modal-open');
}

function selectLocation(location) {
    currentLocation = location;
    const locationText = location === 'all' ? 'All Kampala' : location;
    document.getElementById('locationText').textContent = locationText;
    closeLocationModal();
    applyFilters();
}

// ============================================
// USER AUTHENTICATION
// ============================================

function loadUserSession() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
        updateUserUI();
    }
}

function showLoginModal() {
    document.getElementById('userModal').style.display = 'block';
    document.body.classList.add('modal-open');
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
    document.body.classList.remove('modal-open');
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.user-form').forEach(form => form.classList.remove('active'));
    
    if (tab === 'login') {
        document.querySelector('.tab-btn').classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('signupForm').classList.add('active');
    }
}

function loginUser() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    // Simple validation - in real app, this would check against a backend
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        updateUserUI();
        closeUserModal();
        showNotification(`Welcome back, ${user.name}!`, 'success');
    } else {
        showNotification('Invalid email or password', 'error');
    }
}

function signupUser() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const phone = document.getElementById('signupPhone').value;
    
    if (!name || !email || !password || !phone) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Check if user exists
    if (users.find(u => u.email === email)) {
        showNotification('Email already registered', 'error');
        return;
    }
    
    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password,
        phone: phone,
        joined: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    updateUserUI();
    closeUserModal();
    showNotification('Account created successfully!', 'success');
}

function updateUserUI() {
    const userBtn = document.getElementById('userBtn');
    if (userBtn && currentUser) {
        userBtn.innerHTML = `<i class="fas fa-user"></i> <span class="user-text">${currentUser.name.split(' ')[0]}</span>`;
    }
}

function showForgotPassword() {
    showNotification('Please contact support@theplotug.com', 'info');
}

// ============================================
// SHARE FEATURE
// ============================================

function shareEvent(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    const shareMenu = document.getElementById('shareMenu');
    shareMenu.innerHTML = `
        <div class="share-options">
            <button onclick="shareToWhatsApp('${event.title}', '${event.venue}')" class="share-option whatsapp">
                <i class="fab fa-whatsapp"></i> WhatsApp
            </button>
            <button onclick="shareToTwitter('${event.title}')" class="share-option twitter">
                <i class="fab fa-twitter"></i> Twitter
            </button>
            <button onclick="shareToFacebook('${event.title}')" class="share-option facebook">
                <i class="fab fa-facebook"></i> Facebook
            </button>
            <button onclick="copyEventLink('${event.id}')" class="share-option copy">
                <i class="fas fa-link"></i> Copy Link
            </button>
            <button onclick="closeShareMenu()" class="share-option cancel">
                <i class="fas fa-times"></i> Cancel
            </button>
        </div>
    `;
    
    shareMenu.style.display = 'block';
}

function closeShareMenu() {
    document.getElementById('shareMenu').style.display = 'none';
}

function shareToWhatsApp(title, venue) {
    const text = `Check out this event on The Plot UG: ${title} at ${venue}! 🎉`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    closeShareMenu();
}

function shareToTwitter(title) {
    const text = `Check out ${title} on The Plot UG! 🎉`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    closeShareMenu();
}

function shareToFacebook(title) {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
    closeShareMenu();
}

function copyEventLink(eventId) {
    const dummy = document.createElement('textarea');
    dummy.value = `${window.location.origin}?event=${eventId}`;
    document.body.appendChild(dummy);
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);
    
    showNotification('Link copied to clipboard!', 'success');
    closeShareMenu();
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
// LOADING & UI UTILITIES
// ============================================

function showLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = 'block';
}

function hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = 'none';
}

function updateViewCounts() {
    events.forEach(event => {
        event.views = event.views || 0;
        event.saves = event.saves || 0;
    });
    saveEvents();
}

function updateScrollTopButton() {
    window.addEventListener('scroll', () => {
        const btn = document.getElementById('scrollTop');
        if (btn) {
            btn.style.display = window.scrollY > 300 ? 'block' : 'none';
        }
    });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// DARK MODE
// ============================================

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    
    const icon = document.querySelector('#darkModeToggle i');
    if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Load dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    document.querySelector('#darkModeToggle i').className = 'fas fa-sun';
}

// ============================================
// MOBILE FRIENDLY UTILITIES
// ============================================

function makeMobileFriendly() {
    // Prevent zoom on input focus
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            document.body.style.fontSize = '16px';
        });
    });
    
    // Handle touch events
    document.querySelectorAll('.card, button, .chip').forEach(el => {
        el.addEventListener('touchstart', function() {
            this.style.opacity = '0.7';
        });
        el.addEventListener('touchend', function() {
            this.style.opacity = '1';
        });
    });
}

// ============================================
// EXPORT FUNCTIONS FOR GLOBAL USE
// ============================================

// Make all functions globally available
window.openEventDetails = openEventDetails;
window.closeEventModal = closeEventModal;
window.toggleSaveEvent = toggleSaveEvent;
window.showSavedEvents = showSavedEvents;
window.setEventReminder = setEventReminder;
window.shareEvent = shareEvent;
window.showLoginModal = showLoginModal;
window.closeUserModal = closeUserModal;
window.switchTab = switchTab;
window.loginUser = loginUser;
window.signupUser = signupUser;
window.showForgotPassword = showForgotPassword;
window.applyFilters = applyFilters;
window.clearSearch = clearSearch;
window.resetFilters = resetFilters;
window.showLocationFilter = showLocationFilter;
window.closeLocationModal = closeLocationModal;
window.selectLocation = selectLocation;
window.toggleDarkMode = toggleDarkMode;
window.scrollToTop = scrollToTop;
window.closeShareMenu = closeShareMenu;
window.shareToWhatsApp = shareToWhatsApp;
window.shareToTwitter = shareToTwitter;
window.shareToFacebook = shareToFacebook;
window.copyEventLink = copyEventLink;