document.addEventListener("DOMContentLoaded", function () {
    const loginBtn = document.getElementById("trigger-login");
    const registerBtn = document.getElementById("trigger-register");

    const loginPanel = document.getElementById("content-login");
    const registerPanel = document.getElementById("content-register");

    function activateTab(activeBtn, inactiveBtn, activePanel, inactivePanel) {
        // Update button states
        activeBtn.setAttribute("data-state", "active");
        inactiveBtn.setAttribute("data-state", "inactive");

        // Update panel visibility
        activePanel.removeAttribute("hidden");
        activePanel.setAttribute("data-state", "active");

        inactivePanel.setAttribute("hidden", "");
        inactivePanel.setAttribute("data-state", "inactive");
    }

    loginBtn.addEventListener("click", function () {
        activateTab(loginBtn, registerBtn, loginPanel, registerPanel);
    });

    registerBtn.addEventListener("click", function () {
        activateTab(registerBtn, loginBtn, registerPanel, loginPanel);
    });
    
    function showError(input, message) {
        removeError(input);

        const error = document.createElement("div");
        error.className = "input-error";
        error.textContent = message;

        input.classList.add("error");
        input.insertAdjacentElement("afterend", error);
    }

    function removeError(input) {
        input.classList.remove("error");
        const next = input.nextElementSibling;
        if (next && next.classList.contains("input-error")) {
            next.remove();
        }
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // -----------------------------
    // LOGIN FORM VALIDATION
    // -----------------------------
    const loginEmail = document.getElementById("login-email");
    const loginPassword = document.getElementById("login-lozinka");

    const loginForm = loginPanel.querySelector("form");

    loginForm.addEventListener("submit", function (e) {
        let valid = true;

        removeError(loginEmail);
        removeError(loginPassword);

        if (!loginEmail.value.trim()) {
            showError(loginEmail, "Email je obavezan.");
            valid = false;
        } else if (!validateEmail(loginEmail.value)) {
            showError(loginEmail, "Unesite valjanu email adresu.");
            valid = false;
        }

        if (!loginPassword.value.trim()) {
            showError(loginPassword, "Lozinka je obavezna.");
            valid = false;
        } else if (loginPassword.value.length < 6) {
            showError(loginPassword, "Lozinka mora imati najmanje 6 znakova.");
            valid = false;
        }

        if (!valid) e.preventDefault();
    });

    // -----------------------------
    // REGISTRATION FORM VALIDATION
    // -----------------------------
    const regIme = document.getElementById("register-ime");
    const regPrezime = document.getElementById("register-prezime");
    const regOrg = document.getElementById("register-org");
    const regEmail = document.getElementById("register-email");
    const regPassword = document.getElementById("register-lozinka");

    const registerForm = registerPanel.querySelector("form");

    registerForm.addEventListener("submit", function (e) {
        let valid = true;

        [regIme, regPrezime, regOrg, regEmail, regPassword].forEach(removeError);

        if (!regIme.value.trim()) {
            showError(regIme, "Ime je obavezno.");
            valid = false;
        }

        if (!regPrezime.value.trim()) {
            showError(regPrezime, "Prezime je obavezno.");
            valid = false;
        }

        if (!regOrg.value) {
            showError(regOrg, "Odaberite organizaciju.");
            valid = false;
        }

        if (!regEmail.value.trim()) {
            showError(regEmail, "Email je obavezan.");
            valid = false;
        } else if (!validateEmail(regEmail.value)) {
            showError(regEmail, "Unesite valjanu email adresu.");
            valid = false;
        }

        if (!regPassword.value.trim()) {
            showError(regPassword, "Lozinka je obavezna.");
            valid = false;
        } else if (regPassword.value.length < 6) {
            showError(regPassword, "Lozinka mora imati najmanje 6 znakova.");
            valid = false;
        }

        if (!valid) e.preventDefault();
    });
});