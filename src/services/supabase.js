const customStorage = {
    getItem: (key) => {
        // Try both, prioritize localStorage
        return localStorage.getItem(key) || sessionStorage.getItem(key);
    },
    setItem: (key, value) => {
        const rememberMe = localStorage.getItem('push_remember_me') === 'true';
        if (rememberMe) {
            localStorage.setItem(key, value);
            sessionStorage.removeItem(key); // Cleanup session storage
        } else {
            sessionStorage.setItem(key, value);
            localStorage.removeItem(key); // Cleanup local storage (except the flag)
        }
    },
    removeItem: (key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        storage: customStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});
