// supabase-client.js
// console.log("supabase-client.js: Script execution STARTS.");

const SUPABASE_URL = 'https://onqioqjflhyxtuvofeee.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ucWlvcWpmbGh5eHR1dm9mZWVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMTAwOTEsImV4cCI6MjA2NTU4NjA5MX0.26H-1pQ19QosCvcgRut0FzXkDfIoUa9M8g0gUTZsZu4';

// console.log("supabase-client.js: Credentials - URL:", SUPABASE_URL, "Key Set:", !!SUPABASE_ANON_KEY);

const ACTUAL_PLACEHOLDER_URL = 'YOUR_PROJECT_URL_HERE'; // Only for checking if user has updated
const ACTUAL_PLACEHOLDER_KEY = 'YOUR_ANON_PUBLIC_KEY_HERE'; // Only for checking if user has updated

// Fallback showToast if the main one isn't loaded yet (e.g. if this script runs before navbar-script.js)
// This is a very basic fallback.
function localShowToastFallback(message, type = 'error') {
    console[type === 'error' ? 'error' : 'log'](`Toast Fallback (${type}): ${message}`);
    alert(`[${type.toUpperCase()}] ${message}`); // Keep alert as ultimate fallback
}

// Ensure displayNotification is globally available from this script
window.displayNotification = (message, type = 'info', duration = 3000) => {
    if (typeof window.showToast === 'function') { // Prefer a more sophisticated showToast if available
        window.showToast(message, type, duration);
    } else {
        localShowToastFallback(message, type);
    }
};


if (!SUPABASE_URL || SUPABASE_URL === ACTUAL_PLACEHOLDER_URL) {
    console.error("supabase-client.js: Supabase URL is missing or is still the placeholder.");
    window.displayNotification("CONFIGURATION ERROR: Supabase URL is not set!", "error", 5000);
    window.supabaseClient = null;
} else if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === ACTUAL_PLACEHOLDER_KEY) {
    console.error("supabase-client.js: Supabase Anon Key is missing or is still the placeholder.");
    window.displayNotification("CONFIGURATION ERROR: Supabase Anon Key is not set!", "error", 5000);
    window.supabaseClient = null;
} else if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
    // console.log("supabase-client.js: Global 'supabase' (from CDN) IS available.");
    try {
        window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        if (window.supabaseClient) {
            // console.log("supabase-client.js: window.supabaseClient INITIALIZED SUCCESSFULLY.");
            // Optional success toast for debugging client initialization
            // window.displayNotification("Supabase client initialized.", "success", 1500);
        } else {
            console.error("supabase-client.js: supabase.createClient() did not return a client instance.");
            window.displayNotification("ERROR: Failed to create Supabase client. Check credentials.", "error", 5000);
            window.supabaseClient = null;
        }
    } catch (e) {
        console.error("supabase-client.js: ERROR during supabase.createClient():", e);
        window.displayNotification("ERROR: Exception during Supabase client creation. Check credentials/network.", "error", 5000);
        window.supabaseClient = null;
    }
} else {
    console.error("supabase-client.js: Global 'supabase' object from CDN is NOT available or createClient is missing.");
    window.displayNotification("CRITICAL ERROR: Core Supabase library (CDN) not loaded. Check network/HTML.", "error", 7000);
    window.supabaseClient = null;
}
// console.log("supabase-client.js: Script execution FINISHED. window.supabaseClient is:", window.supabaseClient);