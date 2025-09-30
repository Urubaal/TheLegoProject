// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const resetPasswordForm = document.getElementById('resetPasswordForm');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const signUpLink = document.getElementById('signUpLink');
const signInLink = document.getElementById('signInLink');
const backToLogin = document.getElementById('backToLogin');
const backToLoginFromReset = document.getElementById('backToLoginFromReset');
const backToLoginFromRegister = document.getElementById('backToLoginFromRegister');
const messageContainer = document.getElementById('messageContainer');
const message = document.getElementById('message');
const messageText = document.getElementById('messageText');

// Toggle password visibility
const togglePassword = document.getElementById('togglePassword');
const toggleRegisterPassword = document.getElementById('toggleRegisterPassword');
const toggleConfirmRegisterPassword = document.getElementById('toggleConfirmRegisterPassword');
const toggleNewPassword = document.getElementById('toggleNewPassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

// API Configuration - Now loaded from config.js for dynamic URL
// const API_BASE_URL will be available globally from config.js

// Form validation and submission
class AuthManager {
    constructor() {
        this.currentForm = 'login';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupPasswordToggles();
        this.setupLandingPageButtons();
    }

    setupEventListeners() {
        // Form submissions
        if (loginForm) loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        if (registerForm) registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        if (forgotPasswordForm) forgotPasswordForm.addEventListener('submit', (e) => this.handleForgotPassword(e));
        if (resetPasswordForm) resetPasswordForm.addEventListener('submit', (e) => this.handleResetPassword(e));

        // Navigation
        if (forgotPasswordLink) forgotPasswordLink.addEventListener('click', (e) => this.showForgotPassword(e));
        if (signUpLink) signUpLink.addEventListener('click', (e) => this.showRegister(e));
        if (signInLink) signInLink.addEventListener('click', (e) => this.showLogin(e));
        if (backToLogin) backToLogin.addEventListener('click', (e) => this.showLogin(e));
        if (backToLoginFromReset) backToLoginFromReset.addEventListener('click', (e) => this.showLogin(e));
        if (backToLoginFromRegister) backToLoginFromRegister.addEventListener('click', (e) => this.showLogin(e));

        // Real-time validation
        this.setupRealTimeValidation();
    }

    setupPasswordToggles() {
        if (togglePassword) togglePassword.addEventListener('click', () => this.togglePasswordVisibility('password'));
        if (toggleRegisterPassword) toggleRegisterPassword.addEventListener('click', () => this.togglePasswordVisibility('registerPassword'));
        if (toggleConfirmRegisterPassword) toggleConfirmRegisterPassword.addEventListener('click', () => this.togglePasswordVisibility('confirmRegisterPassword'));
        if (toggleNewPassword) toggleNewPassword.addEventListener('click', () => this.togglePasswordVisibility('newPassword'));
        if (toggleConfirmPassword) toggleConfirmPassword.addEventListener('click', () => this.togglePasswordVisibility('confirmPassword'));
    }

    setupRealTimeValidation() {
        // Login form validation
        const emailInput = document.getElementById('email');
        if (emailInput) emailInput.addEventListener('blur', () => this.validateEmail(emailInput.value, 'emailError'));

        const passwordInput = document.getElementById('password');
        if (passwordInput) passwordInput.addEventListener('input', () => this.validatePassword(passwordInput.value, 'passwordError'));

        // Register form validation
        const registerNameInput = document.getElementById('registerName');
        if (registerNameInput) registerNameInput.addEventListener('blur', () => this.validateName(registerNameInput.value, 'registerNameError'));

        const registerEmailInput = document.getElementById('registerEmail');
        if (registerEmailInput) registerEmailInput.addEventListener('blur', () => this.validateEmail(registerEmailInput.value, 'registerEmailError'));

        const registerPasswordInput = document.getElementById('registerPassword');
        if (registerPasswordInput) registerPasswordInput.addEventListener('input', () => this.validatePassword(registerPasswordInput.value, 'registerPasswordError'));

        const confirmRegisterPasswordInput = document.getElementById('confirmRegisterPassword');
        if (confirmRegisterPasswordInput) confirmRegisterPasswordInput.addEventListener('input', () => this.validateConfirmRegisterPassword());

        // Reset password validation
        const newPasswordInput = document.getElementById('newPassword');
        if (newPasswordInput) newPasswordInput.addEventListener('input', () => this.validatePassword(newPasswordInput.value, 'newPasswordError'));

        const confirmPasswordInput = document.getElementById('confirmPassword');
        if (confirmPasswordInput) confirmPasswordInput.addEventListener('input', () => this.validateConfirmPassword());
    }

    togglePasswordVisibility(inputId) {
        const input = document.getElementById(inputId);
        const toggle = document.getElementById(`toggle${inputId.charAt(0).toUpperCase() + inputId.slice(1)}`);
        
        if (!input || !toggle) return;
        
        const icon = toggle.querySelector('i');
        if (!icon) return;

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    showRegister(e) {
        e.preventDefault();
        this.hideAllForms();
        if (registerForm) registerForm.classList.remove('hidden');
        this.currentForm = 'register';
        this.clearAllErrors();
        this.updateHeader('Create Account', 'Join Brick Buy today');
        this.updateFooter('register');
        
        // Update modal title if exists
        const authModalTitle = document.getElementById('authModalTitle');
        if (authModalTitle) authModalTitle.textContent = 'Create Account';
    }

    showForgotPassword(e) {
        e.preventDefault();
        this.hideAllForms();
        if (forgotPasswordForm) forgotPasswordForm.classList.remove('hidden');
        this.currentForm = 'forgot';
        
        // Update modal title if exists
        const authModalTitle = document.getElementById('authModalTitle');
        if (authModalTitle) authModalTitle.textContent = 'Reset Password';
    }

    showLogin(e) {
        e.preventDefault();
        this.hideAllForms();
        if (loginForm) loginForm.classList.remove('hidden');
        this.currentForm = 'login';
        this.clearAllErrors();
        this.updateHeader('Sign In', 'Welcome back! Sign in to your account');
        this.updateFooter('login');
        
        // Update modal title if exists
        const authModalTitle = document.getElementById('authModalTitle');
        if (authModalTitle) authModalTitle.textContent = 'Sign In';
    }

    showResetPassword() {
        this.hideAllForms();
        if (resetPasswordForm) resetPasswordForm.classList.remove('hidden');
        this.currentForm = 'reset';
    }

    hideAllForms() {
        if (loginForm) loginForm.classList.add('hidden');
        if (registerForm) registerForm.classList.add('hidden');
        if (forgotPasswordForm) forgotPasswordForm.classList.add('hidden');
        if (resetPasswordForm) resetPasswordForm.classList.add('hidden');
    }

    updateHeader(title, subtitle) {
        const headerTitle = document.querySelector('.login-header h1');
        const headerSubtitle = document.querySelector('.login-header p');
        if (headerTitle) headerTitle.textContent = title;
        if (headerSubtitle) headerSubtitle.textContent = subtitle;
    }

    updateFooter(type) {
        const loginFooter = document.getElementById('loginFooterText');
        const registerFooter = document.getElementById('registerFooterText');
        
        if (type === 'login') {
            if (loginFooter) loginFooter.classList.remove('hidden');
            if (registerFooter) registerFooter.classList.add('hidden');
        } else if (type === 'register') {
            if (loginFooter) loginFooter.classList.add('hidden');
            if (registerFooter) registerFooter.classList.remove('hidden');
        }
    }

    clearAllErrors() {
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(error => {
            error.classList.remove('show');
            error.textContent = '';
        });
    }

    showError(fieldId, message) {
        const errorElement = document.getElementById(fieldId);
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    hideError(fieldId) {
        const errorElement = document.getElementById(fieldId);
        errorElement.classList.remove('show');
        errorElement.textContent = '';
    }

    validateName(name, errorId) {
        if (!name) {
            this.showError(errorId, 'Imię i nazwisko jest wymagane');
            return false;
        }
        if (name.length < 2) {
            this.showError(errorId, 'Imię i nazwisko musi mieć co najmniej 2 znaki');
            return false;
        }
        if (name.length > 50) {
            this.showError(errorId, 'Imię i nazwisko nie może mieć więcej niż 50 znaków');
            return false;
        }
        this.hideError(errorId);
        return true;
    }

    validateEmail(email, errorId) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            this.showError(errorId, 'Email jest wymagany');
            return false;
        }
        if (!emailRegex.test(email)) {
            this.showError(errorId, 'Podaj prawidłowy adres email');
            return false;
        }
        this.hideError(errorId);
        return true;
    }

    validatePassword(password, errorId) {
        if (!password) {
            this.showError(errorId, 'Hasło jest wymagane');
            return false;
        }
        if (password.length < 10) {
            this.showError(errorId, 'Hasło musi mieć co najmniej 10 znaków');
            return false;
        }
        if (password.length > 128) {
            this.showError(errorId, 'Hasło nie może mieć więcej niż 128 znaków');
            return false;
        }
        // Check for at least one lowercase, uppercase, number, and special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
        if (!passwordRegex.test(password)) {
            this.showError(errorId, 'Hasło musi zawierać małą literę, wielką literę, cyfrę i znak specjalny (@$!%*?&)');
            return false;
        }
        // Check for common passwords
        const commonPasswords = ['password', 'qwerty', '123456', '12345678'];
        if (commonPasswords.some(p => password.toLowerCase().includes(p))) {
            this.showError(errorId, 'Hasło jest zbyt popularne. Wybierz bardziej unikalne hasło');
            return false;
        }
        // Check for repeated characters
        if (/(.)\1{4,}/.test(password)) {
            this.showError(errorId, 'Hasło zawiera zbyt wiele powtórzonych znaków');
            return false;
        }
        this.hideError(errorId);
        return true;
    }

    validateConfirmRegisterPassword() {
        const registerPassword = document.getElementById('registerPassword').value;
        const confirmRegisterPassword = document.getElementById('confirmRegisterPassword').value;
        
        if (!confirmRegisterPassword) {
            this.showError('confirmRegisterPasswordError', 'Potwierdzenie hasła jest wymagane');
            return false;
        }
        if (registerPassword !== confirmRegisterPassword) {
            this.showError('confirmRegisterPasswordError', 'Hasła nie są identyczne');
            return false;
        }
        this.hideError('confirmRegisterPasswordError');
        return true;
    }

    validateConfirmPassword() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!confirmPassword) {
            this.showError('confirmPasswordError', 'Potwierdzenie hasła jest wymagane');
            return false;
        }
        if (newPassword !== confirmPassword) {
            this.showError('confirmPasswordError', 'Hasła nie są identyczne');
            return false;
        }
        this.hideError('confirmPasswordError');
        return true;
    }

    showMessage(text, isError = false) {
        messageText.textContent = text;
        messageContainer.classList.remove('hidden');
        
        if (isError) {
            message.classList.add('error');
            message.querySelector('i').className = 'fas fa-exclamation-circle';
        } else {
            message.classList.remove('error');
            message.querySelector('i').className = 'fas fa-check-circle';
        }

        // Auto hide after 5 seconds
        setTimeout(() => {
            messageContainer.classList.add('hidden');
        }, 5000);
    }

    setLoading(button, isLoading) {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        this.clearAllErrors();

        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmRegisterPassword').value;

        // Validate inputs
        const isNameValid = this.validateName(name, 'registerNameError');
        const isEmailValid = this.validateEmail(email, 'registerEmailError');
        const isPasswordValid = this.validatePassword(password, 'registerPasswordError');
        const isConfirmPasswordValid = this.validateConfirmRegisterPassword();

        if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
            return;
        }

        const submitButton = e.target.querySelector('button[type="submit"]');
        this.setLoading(submitButton, true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // IMPORTANT: Send cookies with request
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    username: name.toLowerCase().replace(/\s+/g, ''),
                    country: 'Polska'
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Session token is now stored in httpOnly cookie by backend
                // No need to store in localStorage (SECURITY IMPROVEMENT)
                
                this.showMessage('Konto zostało utworzone pomyślnie!', false);
                
                // Redirect to home page
                setTimeout(() => {
                    window.location.href = '/home.html';
                }, 1500);
            } else {
                // Handle different error statuses
                if (response.status === 400) {
                    this.showMessage(data.error || 'Nieprawidłowe dane rejestracji', true);
                } else if (response.status === 409) {
                    this.showMessage('Nieprawidłowe dane logowania', true);
                } else {
                    this.showMessage(data.error || 'Błąd rejestracji', true);
                }
            }
        } catch (error) {
            console.error('Register error:', error);
            this.showMessage('Błąd połączenia z serwerem. Sprawdź połączenie internetowe.', true);
        } finally {
            this.setLoading(submitButton, false);
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        this.clearAllErrors();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Validate inputs
        const isEmailValid = this.validateEmail(email, 'emailError');
        const isPasswordValid = this.validatePassword(password, 'passwordError');

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        const submitButton = e.target.querySelector('button[type="submit"]');
        this.setLoading(submitButton, true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // IMPORTANT: Send cookies with request
                body: JSON.stringify({
                    email,
                    password,
                    rememberMe
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Session token is now stored in httpOnly cookie by backend
                // No need to store in localStorage (SECURITY IMPROVEMENT)
                if (rememberMe) {
                    localStorage.setItem('rememberedUser', email);
                }
                
                this.showMessage('Zalogowano pomyślnie!', false);
                
                // Redirect to home page
                setTimeout(() => {
                    window.location.href = '/home.html';
                }, 1500);
            } else {
                // Handle different error statuses
                if (response.status === 401) {
                    this.showMessage('Nieprawidłowy email lub hasło', true);
                } else if (response.status === 400) {
                    this.showMessage(data.error || 'Nieprawidłowe dane logowania', true);
                } else if (response.status === 429) {
                    this.showMessage('Zbyt wiele prób logowania. Spróbuj ponownie za chwilę', true);
                } else {
                    this.showMessage(data.error || 'Błąd logowania', true);
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Błąd połączenia z serwerem. Sprawdź połączenie internetowe.', true);
        } finally {
            this.setLoading(submitButton, false);
        }
    }

    async handleForgotPassword(e) {
        e.preventDefault();
        this.clearAllErrors();

        const email = document.getElementById('forgotEmail').value;
        const isEmailValid = this.validateEmail(email, 'forgotEmailError');

        if (!isEmailValid) {
            return;
        }

        const submitButton = e.target.querySelector('button[type="submit"]');
        this.setLoading(submitButton, true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                this.showMessage(data.message, false);
                this.showLogin();
            } else {
                this.showMessage(data.error || 'Błąd wysyłania emaila', true);
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            this.showMessage('Błąd połączenia z serwerem. Spróbuj ponownie później.', true);
        } finally {
            this.setLoading(submitButton, false);
        }
    }

    async handleResetPassword(e) {
        e.preventDefault();
        this.clearAllErrors();

        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        const isNewPasswordValid = this.validatePassword(newPassword, 'newPasswordError');
        const isConfirmPasswordValid = this.validateConfirmPassword();

        if (!isNewPasswordValid || !isConfirmPasswordValid) {
            return;
        }

        const submitButton = e.target.querySelector('button[type="submit"]');
        this.setLoading(submitButton, true);

        try {
            // Get token from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');

            if (!token) {
                this.showMessage('Brak tokenu resetującego. Sprawdź link z emaila.', true);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    newPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showMessage('Hasło zostało pomyślnie zresetowane!', false);
                this.showLogin();
            } else {
                this.showMessage(data.error || 'Błąd resetowania hasła', true);
            }
        } catch (error) {
            console.error('Reset password error:', error);
            this.showMessage('Błąd połączenia z serwerem. Spróbuj ponownie.', true);
        } finally {
            this.setLoading(submitButton, false);
        }
    }

    // Check if user is on reset password page
    checkResetPasswordPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
            this.showResetPassword();
        }
    }

    setupLandingPageButtons() {
        console.log('🔧 Setting up landing page buttons...');
        
        // Modal elements
        const authModal = document.getElementById('authModal');
        const closeAuthModal = document.getElementById('closeAuthModal');
        const authModalTitle = document.getElementById('authModalTitle');
        
        console.log('Modal elements:', { authModal: !!authModal, closeAuthModal: !!closeAuthModal });
        
        // Landing page buttons
        const signInBtn = document.getElementById('signInBtn');
        const getStartedBtn = document.getElementById('getStartedBtn');
        const learnMoreBtn = document.getElementById('learnMoreBtn');
        const ctaSignUpBtn = document.getElementById('ctaSignUpBtn');

        console.log('Button elements:', { 
            signInBtn: !!signInBtn, 
            getStartedBtn: !!getStartedBtn, 
            ctaSignUpBtn: !!ctaSignUpBtn 
        });

        // Open modal functions
        const openAuthModal = (showRegister = false) => {
            console.log('🚀 Opening auth modal, showRegister:', showRegister);
            if (!authModal) {
                console.error('❌ authModal not found!');
                return;
            }
            
            authModal.classList.add('active');
            console.log('✅ Modal activated');
            
            if (showRegister) {
                this.showRegister({ preventDefault: () => {} });
            } else {
                this.showLogin({ preventDefault: () => {} });
            }
        };

        const closeModal = () => {
            if (authModal) {
                authModal.classList.remove('active');
            }
        };

        // Event listeners for landing page buttons
        if (signInBtn) {
            console.log('✅ Adding click listener to signInBtn');
            signInBtn.addEventListener('click', (e) => {
                console.log('🖱️ signInBtn clicked!');
                e.preventDefault();
                openAuthModal(false);
            });
        } else {
            console.warn('⚠️ signInBtn not found!');
        }

        if (getStartedBtn) {
            console.log('✅ Adding click listener to getStartedBtn');
            getStartedBtn.addEventListener('click', (e) => {
                console.log('🖱️ getStartedBtn clicked!');
                e.preventDefault();
                openAuthModal(true);
            });
        } else {
            console.warn('⚠️ getStartedBtn not found!');
        }

        if (ctaSignUpBtn) {
            console.log('✅ Adding click listener to ctaSignUpBtn');
            ctaSignUpBtn.addEventListener('click', (e) => {
                console.log('🖱️ ctaSignUpBtn clicked!');
                e.preventDefault();
                openAuthModal(true);
            });
        } else {
            console.warn('⚠️ ctaSignUpBtn not found!');
        }

        if (learnMoreBtn) {
            learnMoreBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
            });
        }

        // Close modal handlers
        if (closeAuthModal) {
            closeAuthModal.addEventListener('click', closeModal);
        }

        if (authModal) {
            authModal.addEventListener('click', (e) => {
                if (e.target === authModal) {
                    closeModal();
                }
            });
        }

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && authModal && authModal.classList.contains('active')) {
                closeModal();
            }
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const authManager = new AuthManager();
    
    // Check if user is on reset password page
    authManager.checkResetPasswordPage();
    
    // Check for remembered user
    checkRememberedUser();
});

// Additional utility functions
function checkRememberedUser() {
    const rememberedUser = localStorage.getItem('rememberedUser');
    const emailInput = document.getElementById('email');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    
    if (rememberedUser && emailInput && rememberMeCheckbox) {
        emailInput.value = rememberedUser;
        rememberMeCheckbox.checked = true;
    }
}

// Check if user is already logged in
function checkAuthStatus() {
    // Session is now in httpOnly cookie - backend will validate automatically
    // Verify session with backend
    fetch(`${API_BASE_URL}/auth/profile`, {
        credentials: 'include' // IMPORTANT: Send cookies
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else if (response.status === 401 || response.status === 403) {
            // Session is invalid or expired
            clearAuthData();
            showSignInButton();
            return null;
        }
        throw new Error(`HTTP ${response.status}`);
    })
    .then(data => {
        if (data && data.success && data.data) {
            // User is logged in, show user dropdown
            showUserDropdown(data.data);
        }
    })
    .catch(error => {
        // Silently handle errors - user is just not logged in
        console.debug('Auth check:', error.message);
        clearAuthData();
        showSignInButton();
    });
}

// Show sign in button
function showSignInButton() {
    const signInBtn = document.getElementById('signInBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (signInBtn) signInBtn.style.display = 'inline-flex';
    if (userDropdown) userDropdown.style.display = 'none';
}

// Show user dropdown with user data
function showUserDropdown(userData) {
    const signInBtn = document.getElementById('signInBtn');
    const userDropdown = document.getElementById('userDropdown');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    
    if (signInBtn) signInBtn.style.display = 'none';
    if (userDropdown) userDropdown.style.display = 'block';
    
    // Set user data
    if (userName && userData.username) {
        userName.textContent = userData.username;
    } else if (userName && userData.name) {
        userName.textContent = userData.name;
    }
    
    if (userAvatar && userData.username) {
        userAvatar.textContent = userData.username.charAt(0).toUpperCase();
    } else if (userAvatar && userData.name) {
        userAvatar.textContent = userData.name.charAt(0).toUpperCase();
    }
    
    // Setup dropdown toggle
    setupUserDropdown();
}

// Setup user dropdown toggle
function setupUserDropdown() {
    const userButton = document.getElementById('userButton');
    const userDropdown = document.getElementById('userDropdown');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (userButton && userDropdown) {
        userButton.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userDropdown.contains(e.target)) {
                userDropdown.classList.remove('active');
            }
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Handle logout
async function handleLogout() {
    try {
        // Call logout endpoint - backend will clear httpOnly cookie
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include' // IMPORTANT: Send cookies
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Clear any remaining local data and redirect
        clearAuthData();
        window.location.reload();
    }
}

// Clear authentication data
function clearAuthData() {
    // Session is in httpOnly cookie - cleared by backend on logout
    // Only clear non-sensitive local data
    localStorage.removeItem('brickBuyUser');
    localStorage.removeItem('brickBuyCollection');
    // Keep rememberedUser if exists (just email, not sensitive)
}

// Check authentication status on page load
window.addEventListener('load', checkAuthStatus);
