// profile-script.js

document.addEventListener('DOMContentLoaded', async function() {
    // console.log("PROFILE-SCRIPT.JS: DOMContentLoaded fired.");

    const supabase = window.supabaseClient; // Assumes supabase-client.js has set this globally

    // Get DOM Elements
    const profilePageTitle = document.getElementById('profilePageTitle');
    const profileEmailEl = document.getElementById('profileEmail');
    const profileNameEl = document.getElementById('profileName');
    const profileUserIdEl = document.getElementById('profileUserId');
    const updateProfileForm = document.getElementById('updateProfileForm');
    const updateFullNameInput = document.getElementById('updateFullName');
    const updateProfileSubmitButton = updateProfileForm ? updateProfileForm.querySelector('button[type="submit"]') : null;


    if (!supabase) {
        console.error("PROFILE-SCRIPT.JS: Supabase client (window.supabaseClient) is not available. Redirecting to login.");
        if (typeof window.showToast === 'function') {
            window.showToast("Authentication error. Please log in to view your profile.", "error", 5000);
        } else {
            alert("Authentication error. Please log in to view your profile.");
        }
        // Redirect after a delay to allow toast to be seen
        setTimeout(() => { window.location.href = 'login.html'; }, 3000);
        return;
    }

    // Function to fetch and display user profile information
    async function loadUserProfile() {
        if (!profileEmailEl || !profileNameEl || !profileUserIdEl || !updateFullNameInput) {
            console.error("PROFILE-SCRIPT.JS: One or more profile display elements are missing from the HTML.");
            return;
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            console.error("PROFILE-SCRIPT.JS: User not logged in or error fetching user.", userError);
            if (typeof window.showToast === 'function') {
                window.showToast("You are not logged in. Redirecting to login page...", "error", 3000);
            } else {
                alert("You are not logged in. Redirecting to login page...");
            }
            setTimeout(() => { window.location.href = 'login.html'; }, 2000);
            return;
        }

        // console.log("PROFILE-SCRIPT.JS: Logged-in user ID:", user.id, "Email:", user.email);
        profileEmailEl.textContent = user.email;
        profileUserIdEl.textContent = user.id;
        if (profilePageTitle && user.email) { // Set page title if element exists
            profilePageTitle.textContent = `Profile: ${user.email}`;
        }


        // Fetch additional profile information from 'profiles' table
        try {
            // console.log("PROFILE-SCRIPT.JS: Attempting to fetch profile for user ID:", user.id);
            const { data: profilesArray, error: profileFetchError } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id); // Fetch as an array first

            // console.log("PROFILE-SCRIPT.JS: Profile fetch response - Error:", profileFetchError, "Data (profilesArray):", profilesArray);

            if (profileFetchError) {
                console.error("PROFILE-SCRIPT.JS: Error fetching profile details:", profileFetchError);
                profileNameEl.textContent = "Could not load profile name.";
                if (typeof window.showToast === 'function') {
                    window.showToast("Error loading profile: " + profileFetchError.message, "error");
                }
            } else if (profilesArray && profilesArray.length === 1) {
                const profileData = profilesArray[0];
                // console.log("PROFILE-SCRIPT.JS: Profile data fetched successfully:", profileData);
                profileNameEl.textContent = profileData.full_name || "Not set";
                updateFullNameInput.value = profileData.full_name || "";
            } else if (profilesArray && profilesArray.length === 0) {
                console.warn("PROFILE-SCRIPT.JS: No profile row found in 'profiles' table for user ID:", user.id);
                profileNameEl.textContent = "Profile not yet set up.";
                updateFullNameInput.value = ""; 
                if (typeof window.showToast === 'function') {
                    window.showToast("Your profile is incomplete. Please set your name below.", "info", 5000);
                }
            } else if (profilesArray && profilesArray.length > 1) {
                 console.error("PROFILE-SCRIPT.JS: CRITICAL DATA INTEGRITY ISSUE - Multiple profiles found for user ID:", user.id, profilesArray);
                profileNameEl.textContent = "Profile data error.";
                if (typeof window.showToast === 'function') {
                    window.showToast("Error: Inconsistent profile data. Contact support.", "error");
                }
            }

        } catch (e) {
            console.error("PROFILE-SCRIPT.JS: Exception during profile fetch:", e);
            profileNameEl.textContent = "Error loading profile.";
            if (typeof window.showToast === 'function') {
                window.showToast("An unexpected error occurred while fetching your profile.", "error");
            }
        }
    }

    // Handle profile update form submission
    if (updateProfileForm && updateFullNameInput && updateProfileSubmitButton) {
        updateProfileForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const newFullName = updateFullNameInput.value.trim();

            if (!newFullName) {
                if (typeof window.showToast === 'function') window.showToast("Full name cannot be empty.", "warning");
                else alert("Full name cannot be empty.");
                return;
            }

            const { data: { user } , error: getUserError } = await supabase.auth.getUser(); 
            if (getUserError || !user) {
                if (typeof window.showToast === 'function') window.showToast("Not authenticated. Please log in again.", "error", 3000);
                else alert("Not authenticated. Please log in again.");
                setTimeout(() => { window.location.href = 'login.html'; }, 2000);
                return;
            }

            updateProfileSubmitButton.disabled = true;
            updateProfileSubmitButton.textContent = "Updating...";

            try {
                // Perform an UPSERT operation
                // Upsert will insert if no row with 'id: user.id' exists, or update if it does.
                const { data: upsertData, error: upsertError } = await supabase
                    .from('profiles')
                    .upsert({ 
                        id: user.id, // This is the matching column for update or the PK for insert
                        full_name: newFullName, 
                        updated_at: new Date().toISOString() // Always update 'updated_at'
                        // created_at will be set by DB default if it's a new insert and col allows null or has default
                    })
                    .select('full_name') // Select the data back to confirm and update UI
                    .single(); // We expect one row to be affected/returned

                if (upsertError) {
                    console.error("PROFILE-SCRIPT.JS: Error upserting profile:", upsertError);
                    if (typeof window.showToast === 'function') window.showToast("Failed to update profile: " + upsertError.message, "error");
                    else alert("Failed to update profile: " + upsertError.message);
                } else if (upsertData) {
                    // console.log("PROFILE-SCRIPT.JS: Profile upserted successfully.", upsertData);
                    if (typeof window.showToast === 'function') window.showToast("Profile updated successfully!", "success");
                    else alert("Profile updated successfully!");
                    
                    if (profileNameEl) profileNameEl.textContent = upsertData.full_name; 
                    if (updateFullNameInput) updateFullNameInput.value = upsertData.full_name;
                } else {
                    console.warn("PROFILE-SCRIPT.JS: Upsert seemed to complete but no specific data returned as expected.");
                    if (typeof window.showToast === 'function') window.showToast("Profile update processed. Refresh to see changes if not immediate.", "info");
                    // Optionally, call loadUserProfile() again to refresh everything from DB
                    // loadUserProfile(); 
                }
            } catch (e) {
                console.error("PROFILE-SCRIPT.JS: Exception during profile upsert:", e);
                if (typeof window.showToast === 'function') window.showToast("An unexpected error occurred while updating your profile.", "error");
                else alert("An unexpected error occurred while updating your profile.");
            } finally {
                updateProfileSubmitButton.disabled = false;
                updateProfileSubmitButton.textContent = "Update Name";
            }
        });
    } else {
        console.warn("PROFILE-SCRIPT.JS: Update profile form or full name input not found.");
    }

    // Load user profile data when the page loads
    loadUserProfile();
});