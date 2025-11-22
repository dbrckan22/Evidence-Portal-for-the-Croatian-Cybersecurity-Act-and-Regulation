document.addEventListener("DOMContentLoaded", () => {

    const API_URL = "https://localhost:7153/api/v1";

    const regForm = document.querySelector("#content-register form");

    const orgSelect = document.getElementById("register-org");

    const loginForm = document.querySelector("#content-login form");

    async function loadOrganizations() {
        try {
            const res = await fetch(`${API_URL}/organizations`);
            const data = await res.json();

            orgSelect.innerHTML = ""; // clear existing

            data.forEach(org => {
                const opt = document.createElement("option");
                opt.value = org.organizationId;
                opt.textContent = org.name;
                orgSelect.appendChild(opt);
            });

        } catch (err) {
            console.error(err);
            alert("Ne mogu učitati organizacije sa servera.");
        }
    }

    loadOrganizations();

    regForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        // collect fields
        const ime = document.getElementById("register-ime").value.trim();
        const prezime = document.getElementById("register-prezime").value.trim();
        const orgId = document.getElementById("register-org").value;
        const email = document.getElementById("register-email").value.trim();
        const lozinka = document.getElementById("register-lozinka").value;

        // assemble DTO for backend
        const payload = {
            organizationId: parseInt(orgId),
            name: ime,
            surname: prezime,
            email: email,
            password: lozinka,
            role: 2
        };

        try {
            const res = await fetch(`${API_URL}/register/user`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                alert("Greška: " + data.message);
                return;
            }

            alert("Uspješna registracija!");
            document.getElementById("trigger-login").click();

        } catch (err) {
            console.error(err);
            alert("Došlo je do pogreške pri spajanju na server.");
        }

        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("login-email").value;
            const lozinka = document.getElementById("login-lozinka").value;

            const res = await fetch("https://localhost:7153/api/v1/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email, password: lozinka })
            });

            const data = await res.json();

            if (!res.ok) {
                alert("Neispravni podaci");
                return;
            }

            alert("Uspješna prijava!");
            window.location.href = "/dashboard.html";
        });
    });

});
