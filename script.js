// ============================================================
// CONFIGURATION
// ============================================================
const API_URL = "https://script.google.com/macros/s/AKfycbxla0sX4_3Wsafd95gfOTOgY0YLYih0IiC-TFgNSNO_l-teRZsbiD09UTfr_h-gXKoxfQ/exec";

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
// CHARGEMENT DES EMPLOYÉS AVEC google.script.run
// ============================================================
// ============================================================
// CHARGEMENT DES EMPLOYÉS - VERSION PROXY CORS
// ============================================================
async function loadEmployees() {
    try {
        showEmployeLoading(true);
        employe.disabled = true;
        
        // Utiliser le proxy CORS pour la requête GET
        const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(API_URL);
        
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            allEmployees = result.data;
            populateEmployeeSelect(allEmployees);
        } else {
            throw new Error(result.message || "Erreur de chargement");
        }
        
    } catch (error) {
        console.error("Erreur chargement employés:", error);
        showError("Impossible de charger la liste des employés. Vérifiez votre connexion.");
    } finally {
        showEmployeLoading(false);
        employe.disabled = false;
    }
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
        employeLoading.classList.remove("d-none");
    } else {
        employeLoading.classList.add("d-none");
    }
}

// ============================================================
// SOUMISSION DU FORMULAIRE AVEC google.script.run
// ============================================================
// ============================================================
// SOUMISSION DU FORMULAIRE - VERSION PROXY CORS
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
        // Construire les paramètres
        const params = new URLSearchParams({
            action: 'save',
            categorie: categorie.value,
            typePause: typePause.value || '',
            departement: departement.value,
            employeId: employe.value
        });
        
        const url = `${API_URL}?${params.toString()}`;
        
        // Utiliser un proxy CORS gratuit
        const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
        
        console.log("Envoi via proxy:", proxyUrl);
        
        const response = await fetch(proxyUrl, {
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
            showSuccess(result);
        } else {
            showError(result.message || "Erreur lors de l'enregistrement");
        }
        
    } catch (error) {
        console.error("Erreur envoi:", error);
        showError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
        setSubmittingState(false);
    }
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

function showSuccess(result) {
    const data = result.data;
    
    confEmploye.textContent = data.employe || "N/A";
    confDepartement.textContent = data.departement || "N/A";
    confCategorie.textContent = data.categorie || "N/A";
    confHeure.textContent = data.heure || "N/A";
    
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
