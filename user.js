/* Go Green shared authentication state */
(function () {
    const STORAGE_KEY = 'goGreenUser';

    function getLoggedInUser() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                if (data && data.name) return data.name;
            }
        } catch (e) {}
        return localStorage.getItem('userName') || '';
    }

    function renderAuthState() {
        const user = getLoggedInUser();
        document.querySelectorAll('.profile-login').forEach(function (box) {
            const loginLink = box.querySelector('a[href="login.html"]');
            const info = box.querySelector('.logged-in-nav');

            if (user) {
                if (loginLink) loginLink.style.display = 'none';
                if (info) {
                    info.style.display = 'block';
                    const name = info.querySelector('#userName, .userName');
                    if (name) name.textContent = user;
                    const button = info.querySelector('button');
                    if (button) button.onclick = logout;
                }
            } else {
                if (loginLink) loginLink.style.display = '';
                if (info) info.style.display = 'none';
            }
        });
    }

    window.logout = function () {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('loggedIn');
        localStorage.removeItem('userName');
        window.location.href = 'login.html';
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderAuthState);
    } else {
        renderAuthState();
    }
})();
