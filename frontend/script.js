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

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Form validation and submission
class AuthManager {
    constructor() {
        this.currentForm = 'login';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupPasswordToggles();
    }

    setupEventListeners() {
        // Form submissions
        loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        forgotPasswordForm.addEventListener('submit', (e) => this.handleForgotPassword(e));
        resetPasswordForm.addEventListener('submit', (e) => this.handleResetPassword(e));

        // Navigation
        forgotPasswordLink.addEventListener('click', (e) => this.showForgotPassword(e));
        signUpLink.addEventListener('click', (e) => this.showRegister(e));
        signInLink.addEventListener('click', (e) => this.showLogin(e));
        backToLogin.addEventListener('click', (e) => this.showLogin(e));
        backToLoginFromReset.addEventListener('click', (e) => this.showLogin(e));
        backToLoginFromRegister.addEventListener('click', (e) => this.showLogin(e));

        // Real-time validation
        this.setupRealTimeValidation();
    }

    setupPasswordToggles() {
        togglePassword.addEventListener('click', () => this.togglePasswordVisibility('password'));
        toggleRegisterPassword.addEventListener('click', () => this.togglePasswordVisibility('registerPassword'));
        toggleConfirmRegisterPassword.addEventListener('click', () => this.togglePasswordVisibility('confirmRegisterPassword'));
        toggleNewPassword.addEventListener('click', () => this.togglePasswordVisibility('newPassword'));
        toggleConfirmPassword.addEventListener('click', () => this.togglePasswordVisibility('confirmPassword'));
    }

    setupRealTimeValidation() {
        // Login form validation
        const emailInput = document.getElementById('email');
        emailInput.addEventListener('blur', () => this.validateEmail(emailInput.value, 'emailError'));

        const passwordInput = document.getElementById('password');
        passwordInput.addEventListener('input', () => this.validatePassword(passwordInput.value, 'passwordError'));

        // Register form validation
        const registerNameInput = document.getElementById('registerName');
        registerNameInput.addEventListener('blur', () => this.validateName(registerNameInput.value, 'registerNameError'));

        const registerEmailInput = document.getElementById('registerEmail');
        registerEmailInput.addEventListener('blur', () => this.validateEmail(registerEmailInput.value, 'registerEmailError'));

        const registerPasswordInput = document.getElementById('registerPassword');
        registerPasswordInput.addEventListener('input', () => this.validatePassword(registerPasswordInput.value, 'registerPasswordError'));

        const confirmRegisterPasswordInput = document.getElementById('confirmRegisterPassword');
        confirmRegisterPasswordInput.addEventListener('input', () => this.validateConfirmRegisterPassword());

        // Reset password validation
        const newPasswordInput = document.getElementById('newPassword');
        newPasswordInput.addEventListener('input', () => this.validatePassword(newPasswordInput.value, 'newPasswordError'));

        const confirmPasswordInput = document.getElementById('confirmPassword');
        confirmPasswordInput.addEventListener('input', () => this.validateConfirmPassword());
    }

    togglePasswordVisibility(inputId) {
        const input = document.getElementById(inputId);
        const toggle = document.getElementById(`toggle${inputId.charAt(0).toUpperCase() + inputId.slice(1)}`);
        const icon = toggle.querySelector('i');

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
        registerForm.classList.remove('hidden');
        this.currentForm = 'register';
        this.clearAllErrors();
        this.updateHeader('Zarejestruj się', 'Utwórz nowe konto');
        this.updateFooter('register');
    }

    showForgotPassword(e) {
        e.preventDefault();
        this.hideAllForms();
        forgotPasswordForm.classList.remove('hidden');
        this.currentForm = 'forgot';
    }

    showLogin(e) {
        e.preventDefault();
        this.hideAllForms();
        loginForm.classList.remove('hidden');
        this.currentForm = 'login';
        this.clearAllErrors();
        this.updateHeader('Zaloguj się', 'Witaj z powrotem! Zaloguj się do swojego konta');
        this.updateFooter('login');
    }

    showResetPassword() {
        this.hideAllForms();
        resetPasswordForm.classList.remove('hidden');
        this.currentForm = 'reset';
    }

    hideAllForms() {
        loginForm.classList.add('hidden');
        registerForm.classList.add('hidden');
        forgotPasswordForm.classList.add('hidden');
        resetPasswordForm.classList.add('hidden');
    }

    updateHeader(title, subtitle) {
        const headerTitle = document.querySelector('.login-header h1');
        const headerSubtitle = document.querySelector('.login-header p');
        headerTitle.textContent = title;
        headerSubtitle.textContent = subtitle;
    }

    updateFooter(type) {
        const loginFooter = document.getElementById('loginFooterText');
        const registerFooter = document.getElementById('registerFooterText');
        
        if (type === 'login') {
            loginFooter.classList.remove('hidden');
            registerFooter.classList.add('hidden');
        } else if (type === 'register') {
            loginFooter.classList.add('hidden');
            registerFooter.classList.remove('hidden');
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
        if (password.length < 8) {
            this.showError(errorId, 'Hasło musi mieć co najmniej 8 znaków');
            return false;
        }
        // Check for at least one lowercase letter, one uppercase letter, and one number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
        if (!passwordRegex.test(password)) {
            this.showError(errorId, 'Hasło musi zawierać co najmniej jedną małą literę, jedną wielką literę i jedną cyfrę');
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
                // Store token in localStorage
                localStorage.setItem('authToken', data.data.token);
                localStorage.setItem('brickBuyToken', data.data.token); // For compatibility
                
                this.showMessage('Konto zostało utworzone pomyślnie!', false);
                
                // Redirect to dashboard or main page
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
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
                body: JSON.stringify({
                    email,
                    password,
                    rememberMe
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store token in localStorage
                localStorage.setItem('authToken', data.data.token);
                localStorage.setItem('brickBuyToken', data.data.token); // For compatibility
                if (rememberMe) {
                    localStorage.setItem('rememberedUser', email);
                }
                
                this.showMessage('Zalogowano pomyślnie!', false);
                
                // Redirect to dashboard or main page
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
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
    if (rememberedUser) {
        document.getElementById('email').value = rememberedUser;
        document.getElementById('rememberMe').checked = true;
    }
}

// Check if user is already logged in
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    if (token) {
        // Verify token with backend
        fetch(`${API_BASE_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // User is logged in, redirect to dashboard
                window.location.href = '/dashboard.html';
            } else {
                // Token is invalid, remove it
                localStorage.removeItem('authToken');
            localStorage.removeItem('brickBuyToken');
            localStorage.removeItem('brickBuyUser');
            localStorage.removeItem('brickBuyCollection');
            }
        })
        .catch(error => {
            console.error('Auth check failed:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('brickBuyToken');
            localStorage.removeItem('brickBuyUser');
            localStorage.removeItem('brickBuyCollection');
        });
    }
}

// Check authentication status on page load
window.addEventListener('load', checkAuthStatus);
