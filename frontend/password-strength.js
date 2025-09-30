/**
 * Password Strength Meter
 * Real-time password strength feedback
 */

class PasswordStrengthMeter {
  constructor() {
    this.commonPasswords = [
      'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
      'monkey', '1234567', 'letmein', 'trustno1', 'dragon', 'baseball',
      'iloveyou', 'master', 'sunshine', 'ashley', 'bailey', 'passw0rd'
    ];
  }

  /**
   * Calculate password strength (0-5)
   * @param {string} password 
   * @returns {Object} strength data
   */
  calculate(password) {
    if (!password) {
      return { score: 0, strength: 'empty', feedback: [], percentage: 0 };
    }

    let score = 0;
    const feedback = [];
    
    // Length check
    if (password.length >= 10) {
      score++;
    } else {
      feedback.push('Użyj co najmniej 10 znaków');
    }
    
    if (password.length >= 16) {
      score++;
    }

    // Character variety checks
    if (/[a-z]/.test(password)) {
      score++;
    } else {
      feedback.push('Dodaj małe litery');
    }

    if (/[A-Z]/.test(password)) {
      score++;
    } else {
      feedback.push('Dodaj wielkie litery');
    }

    if (/\d/.test(password)) {
      score++;
    } else {
      feedback.push('Dodaj cyfry');
    }

    if (/[@$!%*?&]/.test(password)) {
      score++;
    } else {
      feedback.push('Dodaj znaki specjalne (@$!%*?&)');
    }

    // Penalties
    if (this.isCommonPassword(password)) {
      score = Math.max(0, score - 2);
      feedback.push('To hasło jest zbyt popularne');
    }

    if (/(.)\1{4,}/.test(password)) {
      score = Math.max(0, score - 1);
      feedback.push('Unikaj powtarzających się znaków');
    }

    if (this.hasSequentialChars(password)) {
      score = Math.max(0, score - 1);
      feedback.push('Unikaj sekwencji znaków (123, abc)');
    }

    // Normalize score to 0-5
    score = Math.min(5, Math.max(0, score));

    const strengthLabels = {
      0: 'Bardzo słabe',
      1: 'Słabe',
      2: 'Średnie',
      3: 'Dobre',
      4: 'Bardzo dobre',
      5: 'Doskonałe'
    };

    return {
      score,
      strength: strengthLabels[score],
      feedback: feedback.length > 0 ? feedback : ['Świetne hasło!'],
      percentage: (score / 5) * 100
    };
  }

  /**
   * Check if password is common
   */
  isCommonPassword(password) {
    const lower = password.toLowerCase();
    return this.commonPasswords.some(p => lower.includes(p));
  }

  /**
   * Check for sequential characters
   */
  hasSequentialChars(password) {
    const sequences = [
      '0123456789', 'abcdefghijklmnopqrstuvwxyz', 
      'qwertyuiop', 'asdfghjkl', 'zxcvbnm'
    ];
    
    const lower = password.toLowerCase();
    for (const seq of sequences) {
      for (let i = 0; i <= seq.length - 4; i++) {
        const substring = seq.substring(i, i + 4);
        if (lower.includes(substring) || lower.includes(substring.split('').reverse().join(''))) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Render strength meter HTML
   */
  renderMeter(containerId, strength) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const colors = {
      0: '#dc3545', // red
      1: '#dc3545', // red
      2: '#ffc107', // yellow
      3: '#17a2b8', // blue
      4: '#28a745', // green
      5: '#155724'  // dark green
    };

    const color = colors[strength.score];

    container.innerHTML = `
      <div class="password-strength-meter">
        <div class="strength-bar">
          <div class="strength-fill" style="width: ${strength.percentage}%; background-color: ${color}"></div>
        </div>
        <div class="strength-label" style="color: ${color}">
          <strong>${strength.strength}</strong> (${strength.score}/5)
        </div>
        <ul class="strength-feedback">
          ${strength.feedback.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
    `;
  }
}

// Export instance
const passwordStrengthMeter = new PasswordStrengthMeter();
