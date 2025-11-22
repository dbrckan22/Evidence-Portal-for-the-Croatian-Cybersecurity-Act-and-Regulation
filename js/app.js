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
});
