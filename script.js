// ============================================================
// CONFIGURATION
// ============================================================
const API_URL = "https://script.google.com/macros/s/AKfycbyTWwtSVE2D7mHHWJn9vWmXMOBaGD67xWoO_OCaeqw_zCF9z22CiM722Wob-LcSuLKB/exec";
const TIMEZONE = "Africa/Lubumbashi";

// ============================================================
// ÉTAT DE L'APPLICATION
// ============================================================
let allEmployees = [];
let isSubmitting = false;

// ============================================================
// RÉFÉRENCES DOM
// ============================================================
const form = document.getElementById("attendanceForm");
const categorie = document.getElementById("categorie");
const typePause = document.getElementById("typePause");
const pauseTypeContainer = document.getElementById("pauseTypeContainer");
const departement = document.getElementById("departement");
const employe = document.getElementById("employe");
const employeLoading = document.getElementById("employeLoading");
const submitBtn = document.getElementById("submitBtn");
const loadingSpinner = document.getElementById("loadingSpinner");
const errorAlert = document.getElementById("errorAlert");
const errorMessage = document.getElementById("errorMessage");
const successAlert = document.getElementById("successAlert");
const successMessage = document.getElementById("successMessage");
const confirmationContainer = document.getElementById("confirmationContainer");
const confEmploye = document.getElementById("confEmploye");
const confDepartement = document.getElementById("confDepartement");
const confCategorie = document.getElementById("confCategorie");
const confHeure = document.getElementById("confHeure");
const newPointageBtn = document.getElementById("newPointageBtn");

// ============================================================
// INITIALISATION
// ============================================================
document.addEventListener("DOMContentLoaded", function() {
    loadEmployees();
    setupEventListeners();
});

// ============================================================
// ÉVÉNEMENTS
// ============================================================
function setupEventListeners() {
    categorie.addEventListener("change", function() {
        handleCategorieChange();
        filterEmployees();
    });
    
    departement.addEventListener("change", function() {
        filterEmployees();
    });
    
    form.addEventListener("submit", function(e) {
        e.preventDefault();
        handleSubmit();
    });
    
    newPointageBtn.addEventListener("click", function() {
        resetForm();
    });
}

// ============================================================
// GESTION DE LA CATÉGORIE
// ============================================================
function handleCategorieChange() {
    const selected = categorie.value;
    
    if (selected === "PAUSE") {
        pauseTypeContainer.classList.remove("d-none");
        typePause.setAttribute("required", "required");
    } else {
        pauseTypeContainer.classList.add("d-none");
        typePause.removeAttribute("required");
        typePause.value = "";
        typePause.classList.remove("is-invalid");
    }
}

// ============================================================
// CHARGEMENT DES EMPLOYÉS - DIRECT ACCESS (NO PROXY)
// ============================================================
async function loadEmployees() {
    try {
        showEmployeLoading(true);
        employe.disabled = true;
        
        // DIRECT ACCESS - No proxy needed on office network
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Check if access was denied
        if (!result.success && result.error === "UNAUTHORIZED_IP") {
            showAccessDenied(result.ip || "Inconnue");
            return;
        }
        
        if (result.success && result.data) {
            allEmployees = result.data;
            populateEmployeeSelect(allEmployees);
        } else {
            throw new Error(result.message || "Erreur de chargement");
        }
        
    } catch (error) {
        console.error("Erreur chargement employés:", error);
        // Check if it's a CORS error
        if (error.message.includes("fetch") || error.message.includes("network")) {
            showError("Impossible de contacter le serveur. Vérifiez votre connexion réseau.");
        } else {
            showError("Impossible de charger la liste des employés. Vérifiez votre connexion.");
        }
    } finally {
        showEmployeLoading(false);
        employe.disabled = false;
    }
}

// ============================================================
// SHOW ACCESS DENIED
// ============================================================
function showAccessDenied(ip) {
    const form = document.getElementById("attendanceForm");
    const container = form.parentElement;
    
    // Hide form
    form.style.display = 'none';
    
    // Remove existing denied message if any
    const existing = document.getElementById('accessDenied');
    if (existing) existing.remove();
    
    // Create access denied message
    const deniedDiv = document.createElement('div');
    deniedDiv.id = 'accessDenied';
    deniedDiv.className = 'text-center p-4';
    deniedDiv.innerHTML = `
        <i class="bi bi-wifi-off" style="font-size: 4rem; color: #dc3545;"></i>
        <h4 class="text-danger mt-3">ACCÈS NON AUTORISÉ</h4>
        <p class="text-muted">Ce système est accessible uniquement depuis le réseau WiFi du bureau.</p>
        <p class="small text-muted">Veuillez vous connecter au WiFi de l'entreprise.</p>
        <hr>
        <p class="small text-muted">IP détectée: <strong>${ip || 'Inconnue'}</strong></p>
        <p class="small text-muted">IPs autorisées: 192.168.0.x, 153.67.139.198</p>
        <button class="btn btn-outline-primary mt-3" onclick="location.reload()">
            <i class="bi bi-arrow-clockwise me-1"></i>Réessayer
        </button>
    `;
    
    container.appendChild(deniedDiv);
}

// ============================================================
// AFFICHAGE DES EMPLOYÉS
// ============================================================
function populateEmployeeSelect(employees) {
    const selectedDept = departement.value;
    const filtered = employees.filter(emp => 
        !selectedDept || emp.departement === selectedDept
    );
    
    filtered.sort((a, b) => a.nom.localeCompare(b.nom));
    
    employe.innerHTML = '<option value="">Sélectionner employé</option>';
    
    filtered.forEach(emp => {
        const option = document.createElement("option");
        option.value = emp.id;
        option.textContent = `${emp.nom} ${emp.prenom}`;
        employe.appendChild(option);
    });
    
    if (filtered.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Aucun employé dans ce département";
        option.disabled = true;
        employe.appendChild(option);
    }
}

// ============================================================
// FILTRAGE DES EMPLOYÉS
// ============================================================
function filterEmployees() {
    populateEmployeeSelect(allEmployees);
    employe.value = "";
    employe.classList.remove("is-valid", "is-invalid");
}

// ============================================================
// AFFICHAGE DU CHARGEMENT DES EMPLOYÉS
// ============================================================
function showEmployeLoading(loading) {
    if (loading) {
        employeLoading.classList.add("show");
        employeLoading.style.display = "block";
    } else {
        employeLoading.classList.remove("show");
        employeLoading.style.display = "none";
    }
}

// ============================================================
// SOUMISSION DU FORMULAIRE - DIRECT ACCESS
// ============================================================
async function handleSubmit() {
    if (isSubmitting) return;
    
    hideAllAlerts();
    removeValidationStyles();
    
    if (!validateForm()) {
        return;
    }
    
    setSubmittingState(true);
    
    try {
        // Get current time in Kisangani timezone
        const now = new Date();
        const kisanganiTime = now.toLocaleString("fr-FR", {
            timeZone: TIMEZONE,
            hour12: false
        });
        
        // Construire les paramètres
        const params = new URLSearchParams({
            action: 'save',
            categorie: categorie.value,
            typePause: typePause.value || '',
            departement: departement.value,
            employeId: employe.value,
            clientTime: kisanganiTime
        });
        
        const url = `${API_URL}?${params.toString()}`;
        
        console.log("Envoi direct:", url);
        console.log("Heure Kisangani:", kisanganiTime);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            const displayTime = result.data?.heure || getCurrentKisanganiTime();
            showSuccess(result, displayTime);
        } else {
            if (result.error === "UNAUTHORIZED_IP") {
                showAccessDenied(result.ip);
            } else {
                showError(result.message || "Erreur lors de l'enregistrement");
            }
        }
        
    } catch (error) {
        console.error("Erreur envoi:", error);
        showError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
        setSubmittingState(false);
    }
}

// ============================================================
// GET CURRENT KISANGANI TIME
// ============================================================
function getCurrentKisanganiTime() {
    const now = new Date();
    return now.toLocaleTimeString("fr-FR", {
        timeZone: TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

// ============================================================
// VALIDATION FRONTEND
// ============================================================
function validateForm() {
    let isValid = true;
    
    if (!categorie.value) {
        categorie.classList.add("is-invalid");
        isValid = false;
    } else {
        categorie.classList.remove("is-invalid");
        categorie.classList.add("is-valid");
    }
    
    if (categorie.value === "PAUSE") {
        if (!typePause.value) {
            typePause.classList.add("is-invalid");
            isValid = false;
        } else {
            typePause.classList.remove("is-invalid");
            typePause.classList.add("is-valid");
        }
    }
    
    if (!departement.value) {
        departement.classList.add("is-invalid");
        isValid = false;
    } else {
        departement.classList.remove("is-invalid");
        departement.classList.add("is-valid");
    }
    
    if (!employe.value) {
        employe.classList.add("is-invalid");
        isValid = false;
    } else {
        employe.classList.remove("is-invalid");
        employe.classList.add("is-valid");
    }
    
    return isValid;
}

// ============================================================
// ÉTAT DE SOUMISSION
// ============================================================
function setSubmittingState(submitting) {
    isSubmitting = submitting;
    
    if (submitting) {
        submitBtn.disabled = true;
        submitBtn.classList.add("opacity-50");
        loadingSpinner.classList.remove("d-none");
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>ENREGISTREMENT...';
    } else {
        submitBtn.disabled = false;
        submitBtn.classList.remove("opacity-50");
        loadingSpinner.classList.add("d-none");
        submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>ENREGISTRER LE POINTAGE';
    }
}

// ============================================================
// AFFICHAGE DES MESSAGES
// ============================================================
function showError(message) {
    errorMessage.textContent = message;
    errorAlert.classList.remove("d-none");
    errorAlert.classList.add("show");
    errorAlert.scrollIntoView({ behavior: "smooth", block: "center" });
}

function showSuccess(result, displayTime) {
    const data = result.data;
    
    confEmploye.textContent = data.employe || "N/A";
    confDepartement.textContent = data.departement || "N/A";
    confCategorie.textContent = data.categorie || "N/A";
    confHeure.textContent = displayTime || data.heure || "N/A";
    
    form.classList.add("d-none");
    confirmationContainer.classList.remove("d-none");
    confirmationContainer.classList.add("show");
    
    successMessage.textContent = "Pointage enregistré avec succès !";
    successAlert.classList.remove("d-none");
    successAlert.classList.add("show");
    
    successAlert.scrollIntoView({ behavior: "smooth", block: "center" });
}

function hideAllAlerts() {
    errorAlert.classList.add("d-none");
    errorAlert.classList.remove("show");
    successAlert.classList.add("d-none");
    successAlert.classList.remove("show");
}

function removeValidationStyles() {
    document.querySelectorAll(".is-valid, .is-invalid").forEach(el => {
        el.classList.remove("is-valid", "is-invalid");
    });
}

// ============================================================
// RÉINITIALISATION DU FORMULAIRE
// ============================================================
function resetForm() {
    form.reset();
    form.classList.remove("d-none");
    form.style.display = 'block';
    
    // Remove access denied message if present
    const deniedDiv = document.getElementById('accessDenied');
    if (deniedDiv) {
        deniedDiv.remove();
    }
    
    pauseTypeContainer.classList.add("d-none");
    typePause.value = "";
    typePause.removeAttribute("required");
    
    populateEmployeeSelect(allEmployees);
    
    hideAllAlerts();
    removeValidationStyles();
    
    confirmationContainer.classList.add("d-none");
    confirmationContainer.classList.remove("show");
    
    setSubmittingState(false);
    
    document.querySelector(".card").scrollIntoView({ behavior: "smooth", block: "center" });
}
