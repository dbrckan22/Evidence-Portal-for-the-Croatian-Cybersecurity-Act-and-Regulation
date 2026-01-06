document.addEventListener("DOMContentLoaded", () => {

    const API_URL = "http://localhost:5059/api/v1";

    const regForm = document.querySelector("#content-register form");
    const orgSelect = document.getElementById("register-org");
    const loginForm = document.querySelector("#content-login form");

    // load org on page load
    async function loadOrganizations() {
        try {
            const res = await fetch(`${API_URL}/organizations`);
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const data = await res.json();

            orgSelect.innerHTML = "<option value=''>Odaberite organizaciju...</option>"; // clear existing

            data.forEach(org => {
                const opt = document.createElement("option");
                opt.value = org.organizationId || org.id;
                opt.textContent = org.name;
                orgSelect.appendChild(opt);
            });

        } catch (err) {
            console.error("Error loading organizations:", err);
            alert("Ne mogu učitati organizacije sa servera. Provjerite je li backend pokrenut.");
            orgSelect.innerHTML = "<option value=''>Greška pri učitavanju...</option>";
        }
    }

    // call load org
    loadOrganizations();

    // registration form submit handle
    if (regForm) {
        regForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            // collect fields
            const ime = document.getElementById("register-ime").value.trim();
            const prezime = document.getElementById("register-prezime").value.trim();
            const orgId = document.getElementById("register-org").value;
            const email = document.getElementById("register-email").value.trim();
            const lozinka = document.getElementById("register-lozinka").value;

            // validacija
            if (!ime || !prezime || !orgId || !email || !lozinka) {
                alert("Molimo ispunite sva polja!");
                return;
            }

            // assemble DTO for backend
            const payload = {
                organizationId: parseInt(orgId),
                name: ime,
                surname: prezime,
                email: email,
                password: lozinka,
                role: 1
            };

            try {
                const res = await fetch(`${API_URL}/register/user`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();

                if (!res.ok) {
                    alert("Greška: " + (data.message || "Registracija nije uspjela"));
                    return;
                }

                alert("Uspješna registracija!");
                
                // clear form
                regForm.reset();
                
                // switch to login tab
                document.getElementById("trigger-login").click();

            } catch (err) {
                console.error("Registration error:", err);
                alert("Došlo je do pogreške pri spajanju na server.");
            }
        });
    }

    // login form submit handler
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("login-email").value.trim();
            const lozinka = document.getElementById("login-lozinka").value;

            // validacija
            if (!email || !lozinka) {
                alert("Molimo unesite email i lozinku!");
                return;
            }

            try {
                const res = await fetch(`${API_URL}/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        email: email, 
                        password: lozinka 
                    })
                });

                const data = await res.json();

                if (!res.ok) {
                    alert("Neispravni podaci za prijavu");
                    return;
                }

                // store user data za sesiju
                // store user data za sesiju
                if (data.user) {
                    sessionStorage.setItem('userId', data.user.userId);
                    sessionStorage.setItem('organizationId', data.user.organizationId);
                    sessionStorage.setItem('userEmail', data.user.email);
                    sessionStorage.setItem('userName', data.user.name);
                } else {
                    sessionStorage.setItem('userId', data.userId || data.id);
                    sessionStorage.setItem('organizationId', data.organizationId || 1);
                    sessionStorage.setItem('userEmail', email);
                    sessionStorage.setItem('userName', data.name || '');
                }

                console.log('Login successful, stored:', {
                    userId: sessionStorage.getItem('userId'),
                    organizationId: sessionStorage.getItem('organizationId')
                });

                alert("Uspješna prijava!");
                
                // redirect to dashboard
                window.location.href = "dashboard.html";

            } catch (err) {
                console.error("Login error:", err);
                alert("Došlo je do pogreške pri spajanju na server.");
            }
        });
    }

    // add new organization button handler
    const addOrgButton = document.getElementById("dodati-novu-org");
    const backToRegisterButton = document.getElementById("back-to-register");
    
    if (addOrgButton) {
        addOrgButton.addEventListener("click", function() {
            // hide registration form
            document.getElementById("content-register").setAttribute("hidden", "");
            document.getElementById("content-register").setAttribute("data-state", "inactive");
            
            // show organization form
            document.getElementById("content-org-new").removeAttribute("hidden");
            document.getElementById("content-org-new").setAttribute("data-state", "active");
        });
    }

    if (backToRegisterButton) {
        backToRegisterButton.addEventListener("click", function() {
            // hide organization form
            document.getElementById("content-org-new").setAttribute("hidden", "");
            document.getElementById("content-org-new").setAttribute("data-state", "inactive");
            
            // show registration form
            document.getElementById("content-register").removeAttribute("hidden");
            document.getElementById("content-register").setAttribute("data-state", "active");
        });
    }

    // new org form submit handler
    const orgForm = document.querySelector("#content-org-new form");
    
    if (orgForm) {
        orgForm.addEventListener("submit", async function(e) {
            e.preventDefault();

            const oib = document.getElementById("org-oib").value.trim();
            const name = document.getElementById("org-name").value.trim();
            const email = document.getElementById("org-email").value.trim();

            // validacija
            if (!oib || !name || !email) {
                alert("Molimo ispunite sva polja!");
                return;
            }

            const payload = {
                oib: oib,
                name: name,
                contactEmail: email
            };

            try {
                const res = await fetch(`${API_URL}/organizations`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();

                if (!res.ok) {
                    alert("Greška: " + (data.message || "Nije moguće dodati organizaciju"));
                    return;
                }

                alert("Organizacija uspješno dodana!");
                
                // clear form
                orgForm.reset();
                
                // reload organizations
                await loadOrganizations();
                
                // nazad na registration
                backToRegisterButton.click();

            } catch (err) {
                console.error("Organization registration error:", err);
                alert("Došlo je do pogreške pri spajanju na server.");
            }
        });
    }

});