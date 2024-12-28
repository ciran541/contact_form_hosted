// Initialize map
let map;

// Load map and API key securely
async function loadMap() {
    try {
        const response = await fetch('map-data.php');
        const data = await response.json();
        
        // Load Google Maps script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&callback=initMapCallback`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
        
        // Store data globally
        window.mapData = data;
    } catch (error) {
        console.error('Error loading map:', error);
    }
}

// Callback for Google Maps
function initMapCallback() {
    const data = window.mapData;
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 16,
        center: data.location,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_RIGHT
        }
    });

    const markerInfo = `
        <div style="padding: 10px;">
            <h3 style="margin: 0 0 5px;">${data.name}</h3>
            <div style="color: #666;">
                <div style="margin-bottom: 5px;">
                    <span style="color: #ffd700;">★★★★★</span> 5.0
                </div>
                <div>${data.address}</div>
            </div>
        </div>
    `;

    const infowindow = new google.maps.InfoWindow({
        content: markerInfo
    });

    const marker = new google.maps.Marker({
        position: data.location,
        map: map,
        title: data.name
    });

    marker.addListener("click", () => {
        infowindow.open(map, marker);
    }); 

    infowindow.open(map, marker);
}

// Load map when page loads
loadMap();

// Form handling
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contactForm');
    const loadingSpinner = document.querySelector('.loading-spinner');
    const feedbackMessage = document.querySelector('.feedback-message');

    // Utility functions
    function toggleLoading(show) {
        loadingSpinner.style.display = show ? 'flex' : 'none';
    }

    function showFeedback(message, isSuccess) {
    const feedbackMessage = document.querySelector('.feedback-message');
    if (feedbackMessage) {
        feedbackMessage.textContent = message;
        feedbackMessage.className = 'feedback-message ' + (isSuccess ? 'feedback-success' : 'feedback-error');
        feedbackMessage.style.display = 'block';
        feedbackMessage.style.opacity = '1';
        feedbackMessage.style.transform = 'translateY(0)';
        
        setTimeout(() => {
            feedbackMessage.style.opacity = '0';
            feedbackMessage.style.transform = 'translateY(150%)';
        }, 5000);
    }
}

    function clearError(input) {
        const errorMessage = input.parentElement.nextElementSibling;
        input.style.borderColor = '#ddd';
        input.parentElement.querySelector('.input-icon').style.borderColor = '#ddd';
        if (errorMessage && errorMessage.classList.contains('error-message')) {
            errorMessage.style.display = 'none';
        }
    }

    function validateField(input) {
        if (input.type === 'checkbox') {
            return validateCheckbox(input);
        }

        const errorMessage = input.parentElement.nextElementSibling;
        
        if (input.required && !input.value.trim()) {
            input.style.borderColor = '#dc3545';
            input.parentElement.querySelector('.input-icon').style.borderColor = '#dc3545';
            if (errorMessage) {
                errorMessage.style.display = 'block';
            }
            return false;
        }

        if (input.type === 'email' && !isValidEmail(input.value)) {
            input.style.borderColor = '#dc3545';
            input.parentElement.querySelector('.input-icon').style.borderColor = '#dc3545';
            if (errorMessage) {
                errorMessage.textContent = 'Please enter a valid email address';
                errorMessage.style.display = 'block';
            }
            return false;
        }

        if (input.id === 'contactNumber' && !isValidPhone(input.value)) {
            input.style.borderColor = '#dc3545';
            input.parentElement.querySelector('.input-icon').style.borderColor = '#dc3545';
            if (errorMessage) {
                errorMessage.textContent = 'Please enter a valid phone number';
                errorMessage.style.display = 'block';
            }
            return false;
        }

        clearError(input);
        return true;
    }

    function validateCheckbox(checkbox) {
        const errorMessage = checkbox.parentElement.nextElementSibling;
        if (checkbox.required && !checkbox.checked) {
            if (errorMessage) {
                errorMessage.style.display = 'block';
            }
            return false;
        }
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
        return true;
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isValidPhone(phone) {
        return /^\+?[\d\s-]{8,}$/.test(phone);
    }

    // Submit form data
    async function submitToGoogleSheets(formData) {
    try {
        const data = {
            timestamp: new Date().toLocaleString(),
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            contactNumber: document.getElementById('contactNumber').value,
            email: document.getElementById('email').value,
            purposes: Array.from(document.querySelectorAll('input[name="purpose"]:checked'))
                .map(cb => cb.value)
                .join(', '),
            message: document.getElementById('message').value,
            terms: document.getElementById('terms').checked ? 'Yes' : 'No'
        };

        const response = await fetch('submit-form.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result && result.status === 'success') {
            showFeedback('Thank you for enquiring, we will be in touch as soon as possible.!', true);
            form.reset();
        } else {
            throw new Error(result.message || 'Submission failed');
        }
    } catch (error) {
        console.error('Submission error:', error);
        showFeedback(error.message || 'Error submitting form. Please try again.', false);
    } finally {
        toggleLoading(false);  // This ensures the spinner is always hidden
    }
}

    // Form submit handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        let isValid = true;

        // Validate required inputs
        const requiredFields = ['firstName', 'lastName', 'contactNumber', 'email'];
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!validateField(field)) {
                isValid = false;
            }
        });

        // Validate terms checkbox
        if (!document.getElementById('terms').checked) {
            document.querySelector('#terms').parentElement.nextElementSibling.style.display = 'block';
            isValid = false;
        }

        if (isValid) {
            toggleLoading(true);
            const formData = new FormData(this);
            await submitToGoogleSheets(formData);
        }
    });

    // Real-time validation
    form.querySelectorAll('.input-field').forEach(input => {
        if (input.type !== 'checkbox') {
            input.addEventListener('input', function() {
                clearError(input);
            });

            input.addEventListener('blur', function() {
                validateField(input);
            });
        }
    });

    // Terms checkbox validation
    document.getElementById('terms').addEventListener('change', function() {
        validateCheckbox(this);
    });
});