// API Configuration - Auto-injected by CDK deployment via config.js
const API_URL = window.API_URL || 'http://localhost:3000';

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success' or 'error'
 */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

/**
 * Switch between tabs
 * @param {string} tabId - ID of tab to switch to
 */
function switchTab(tabId) {
  // Update tab buttons
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabId);
  });
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === tabId);
  });
  
  // Load participants when switching to that tab
  if (tabId === 'participants') {
    loadParticipants();
  }
}

/**
 * Load and display participants
 */
async function loadParticipants() {
  const listContainer = document.getElementById('participantsList');
  listContainer.innerHTML = '<p class="loading">Loading participants... 🎄</p>';
  
  try {
    const response = await fetch(`${API_URL}/participants`);
    if (!response.ok) throw new Error('Failed to load participants');
    
    const data = await response.json();
    const participants = data.participants || [];
    
    if (participants.length === 0) {
      listContainer.innerHTML = '<p class="empty-state">No participants yet. Be the first to join! 🎅</p>';
      return;
    }
    
    listContainer.innerHTML = participants.map(p => `
      <div class="participant-item">
        <span class="participant-name">${escapeHtml(p.name)}</span>
        <button class="btn btn-danger" onclick="removeParticipant('${escapeHtml(p.email)}')">
          Remove
        </button>
      </div>
    `).join('');
  } catch (error) {
    console.error('Load error:', error);
    listContainer.innerHTML = '<p class="empty-state">Failed to load participants. Please try again.</p>';
  }
}


/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Register a new participant
 * @param {Event} event - Form submit event
 */
async function registerParticipant(event) {
  event.preventDefault();
  
  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span>⏳</span> Registering...';
  
  const formData = {
    name: form.name.value.trim(),
    email: form.email.value.trim().toLowerCase(),
    wishlist: form.wishlist.value.trim(),
  };
  
  try {
    const response = await fetch(`${API_URL}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    showToast('🎉 Registration successful! Check your email to confirm.', 'success');
    form.reset();
    switchTab('participants');
  } catch (error) {
    console.error('Registration error:', error);
    showToast(error.message || 'Registration failed. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

/**
 * Remove a participant
 * @param {string} email - Email of participant to remove
 */
async function removeParticipant(email) {
  if (!confirm('Are you sure you want to remove this participant?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/participants/${encodeURIComponent(email)}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to remove participant');
    }
    
    showToast('Participant removed successfully! 👋', 'success');
    loadParticipants();
  } catch (error) {
    console.error('Remove error:', error);
    showToast(error.message || 'Failed to remove participant.', 'error');
  }
}

/**
 * Trigger Secret Santa randomization
 */
async function randomizeSecretSanta() {
  if (!confirm('🎅 Ready to assign Secret Santas?\n\nThis will send emails to ALL participants with their assignments.\n\nAre you sure?')) {
    return;
  }
  
  const btn = document.getElementById('randomizeBtn');
  const originalText = btn.innerHTML;
  
  btn.disabled = true;
  btn.innerHTML = '<span>🎄</span> Assigning Secret Santas...';
  
  try {
    const response = await fetch(`${API_URL}/randomize`, {
      method: 'POST',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Randomization failed');
    }
    
    showToast(`🎉 Secret Santa assignments sent to ${data.participantCount} participants!`, 'success');
  } catch (error) {
    console.error('Randomize error:', error);
    showToast(error.message || 'Failed to assign Secret Santas.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
  
  // Form submission
  document.getElementById('registerForm').addEventListener('submit', registerParticipant);
});

// Optional: allow manual trigger via console if admin UI is hidden
const randomizeBtn = document.getElementById('randomizeBtn');
if (randomizeBtn) {
  randomizeBtn.addEventListener('click', randomizeSecretSanta);
}
});
