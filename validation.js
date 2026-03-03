// --- Validation helpers ---

/**
 * Returns true if the value is a valid UCF student email.
 * Accepted format: 2–3 letters followed by 5–8 digits, then @ucf.edu
 * Example: aa123456@ucf.edu
 */
function isValidUCFEmail(value) {
  return /^[a-zA-Z]{2,3}\d{5,8}@ucf\.edu$/.test(value.trim());
}

/**
 * Returns true if the value matches the pattern NNN-NNN-NNNN.
 */
function isValidPhone(value) {
  return /^\d{3}-\d{3}-\d{4}$/.test(value.trim());
}

/**
 * Returns true if the value is a non-empty string (after trimming).
 */
function isNonEmpty(value) {
  return value.trim().length > 0;
}

/**
 * Returns true if the selected date string (YYYY-MM-DD) represents a date
 * that is strictly after today in the Eastern Time Zone.
 */
function isAfterTodayEST(dateString) {
  if (!dateString) return false;

  // Use Intl.DateTimeFormat to reliably extract the current date in Eastern Time
  // (automatically handles both EST and EDT).
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const todayEST = new Date(
    Number(parts.find((p) => p.type === 'year').value),
    Number(parts.find((p) => p.type === 'month').value) - 1,
    Number(parts.find((p) => p.type === 'day').value)
  );

  // Parse the input value as a plain calendar date to avoid timezone-shift issues.
  const [year, month, day] = dateString.split('-').map(Number);
  const selectedDate = new Date(year, month - 1, day);

  return selectedDate > todayEST;
}

// --- Field references ---
const firstNameInput  = document.getElementById('firstName');
const lastNameInput   = document.getElementById('lastName');
const emailInput      = document.getElementById('email');
const phoneInput      = document.getElementById('phone');
const eventDateInput  = document.getElementById('eventDate');
const submitBtn       = document.getElementById('submitBtn');

const firstNameError  = document.getElementById('firstNameError');
const lastNameError   = document.getElementById('lastNameError');
const emailError      = document.getElementById('emailError');
const phoneError      = document.getElementById('phoneError');
const eventDateError  = document.getElementById('eventDateError');

// Track which fields have been touched (blurred at least once)
const touched = {
  firstName: false,
  lastName:  false,
  email:     false,
  phone:     false,
  eventDate: false,
};

// --- Individual validators (return true if valid) ---

function validateFirstName() {
  const valid = isNonEmpty(firstNameInput.value);
  if (touched.firstName) {
    setFieldState(firstNameInput, firstNameError, valid,
      valid ? '' : 'First name is required.');
  }
  return valid;
}

function validateLastName() {
  const valid = isNonEmpty(lastNameInput.value);
  if (touched.lastName) {
    setFieldState(lastNameInput, lastNameError, valid,
      valid ? '' : 'Last name is required.');
  }
  return valid;
}

function validateEmail() {
  const valid = isValidUCFEmail(emailInput.value);
  if (touched.email) {
    setFieldState(emailInput, emailError, valid,
      valid ? '' : 'Enter a valid UCF email (e.g. ab123456@ucf.edu).');
  }
  return valid;
}

function validatePhone() {
  const valid = isValidPhone(phoneInput.value);
  if (touched.phone) {
    setFieldState(phoneInput, phoneError, valid,
      valid ? '' : 'Enter a phone number in the format 123-456-7890.');
  }
  return valid;
}

function validateEventDate() {
  const valid = isAfterTodayEST(eventDateInput.value);
  if (touched.eventDate) {
    setFieldState(eventDateInput, eventDateError, valid,
      valid ? '' : 'Please select a date after today (Eastern Time).');
  }
  return valid;
}

// --- UI helper ---

function setFieldState(input, errorSpan, isValid, message) {
  errorSpan.textContent = message;
  input.classList.toggle('valid', isValid);
  input.classList.toggle('invalid', !isValid);
}

// --- Update submit button state ---

function updateSubmitButton() {
  const allValid =
    validateFirstName() &&
    validateLastName()  &&
    validateEmail()     &&
    validatePhone()     &&
    validateEventDate();
  submitBtn.disabled = !allValid;
}

// --- Event listeners ---

/**
 * Attach blur + live-update listeners.
 * changeEvent: the event name to use for live updates ('input' for text fields,
 *              'change' for date fields since native pickers don't fire 'input').
 */
function attachListeners(input, touchKey, validateFn, changeEvent = 'input') {
  input.addEventListener('blur', () => {
    touched[touchKey] = true;
    validateFn();
    updateSubmitButton();
  });
  input.addEventListener(changeEvent, () => {
    if (changeEvent === 'change') touched[touchKey] = true;
    if (touched[touchKey]) {
      validateFn();
      updateSubmitButton();
    }
  });
}

attachListeners(firstNameInput, 'firstName', validateFirstName);
attachListeners(lastNameInput,  'lastName',  validateLastName);
attachListeners(emailInput,     'email',     validateEmail);
attachListeners(phoneInput,     'phone',     validatePhone);
attachListeners(eventDateInput, 'eventDate', validateEventDate, 'change');

// --- Form submission ---

document.getElementById('signupForm').addEventListener('submit', (e) => {
  e.preventDefault();

  // Mark all fields as touched so errors are shown on attempted submit
  Object.keys(touched).forEach((key) => { touched[key] = true; });

  // Re-run all validators to show any remaining errors
  validateFirstName();
  validateLastName();
  validateEmail();
  validatePhone();
  validateEventDate();
  updateSubmitButton();

  if (!submitBtn.disabled) {
    alert('Sign-up successful! We will be in touch.');
    document.getElementById('signupForm').reset();
    Object.keys(touched).forEach((key) => { touched[key] = false; });
    [firstNameInput, lastNameInput, emailInput, phoneInput, eventDateInput].forEach((inp) => {
      inp.classList.remove('valid', 'invalid');
    });
    [firstNameError, lastNameError, emailError, phoneError, eventDateError].forEach((err) => {
      err.textContent = '';
    });
    submitBtn.disabled = true;
  }
});
