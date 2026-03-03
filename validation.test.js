/**
 * validation.test.js
 *
 * A self-contained browser test suite for the Event Sign-Up form.
 *
 * How to run:
 *   Open test.html in a browser.  Results are displayed on the page and
 *   are also logged to the browser console.
 *
 * What is tested:
 *   1. isValidUCFEmail  – edge cases for the UCF e-mail format
 *   2. isValidPhone     – edge cases for the NNN-NNN-NNNN phone format
 *   3. isNonEmpty       – blank / whitespace-only values
 *   4. isAfterTodayEST  – past, today, and future dates
 *   5. Submit button    – disabled until ALL fields are valid (not just some)
 */

// ---------------------------------------------------------------------------
// Minimal test runner
// ---------------------------------------------------------------------------

const _results = [];

function _assert(description, actual, expected) {
  const passed = actual === expected;
  _results.push({ description, passed, actual, expected });
  if (!passed) {
    console.error(`FAIL  ${description}\n      expected: ${expected}, got: ${actual}`);
  }
  return passed;
}

function _group(name) {
  _results.push({ group: name });
}

// ---------------------------------------------------------------------------
// Helper – produce a YYYY-MM-DD string offset by `days` from today in EST.
// Uses the same Eastern-Time logic as isAfterTodayEST() so that "today" and
// "tomorrow" are consistent regardless of the machine's local time zone.
// ---------------------------------------------------------------------------

function _estDateOffset(days) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const year  = Number(parts.find((p) => p.type === 'year').value);
  const month = Number(parts.find((p) => p.type === 'month').value);
  const day   = Number(parts.find((p) => p.type === 'day').value);

  const d    = new Date(year, month - 1, day + days);
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ---------------------------------------------------------------------------
// 1. isValidUCFEmail
// ---------------------------------------------------------------------------

function testIsValidUCFEmail() {
  _group('isValidUCFEmail');

  // valid cases
  _assert('2-letter prefix + 6 digits',        isValidUCFEmail('ab123456@ucf.edu'),  true);
  _assert('3-letter prefix + 5 digits',        isValidUCFEmail('abc12345@ucf.edu'),  true);
  _assert('2-letter prefix + 8 digits',        isValidUCFEmail('ab12345678@ucf.edu'), true);
  _assert('uppercase letters are accepted',    isValidUCFEmail('AB123456@ucf.edu'),  true);

  // invalid – prefix length
  _assert('1-letter prefix is rejected',       isValidUCFEmail('a1234567@ucf.edu'),  false);
  _assert('4-letter prefix is rejected',       isValidUCFEmail('abcd12345@ucf.edu'), false);

  // invalid – digit count
  _assert('only 4 digits is rejected',         isValidUCFEmail('ab1234@ucf.edu'),    false);
  _assert('9 digits is rejected',              isValidUCFEmail('ab123456789@ucf.edu'), false);

  // invalid – domain
  _assert('gmail domain is rejected',          isValidUCFEmail('ab123456@gmail.com'), false);
  _assert('ucf.edu.org domain is rejected',    isValidUCFEmail('ab123456@ucf.edu.org'), false);
  _assert('missing domain is rejected',        isValidUCFEmail('ab123456'),           false);

  // invalid – digits in prefix
  _assert('digits in prefix are rejected',     isValidUCFEmail('a1b23456@ucf.edu'),  false);

  // surrounding whitespace – trimmed internally, so the email is still accepted
  _assert('leading space is accepted (trimmed)',  isValidUCFEmail(' ab123456@ucf.edu'), true);
  _assert('trailing space is accepted (trimmed)', isValidUCFEmail('ab123456@ucf.edu '), true);

  // invalid – empty
  _assert('empty string is rejected',          isValidUCFEmail(''),                  false);
}

// ---------------------------------------------------------------------------
// 2. isValidPhone
// ---------------------------------------------------------------------------

function testIsValidPhone() {
  _group('isValidPhone');

  // valid
  _assert('standard NNN-NNN-NNNN',             isValidPhone('123-456-7890'),  true);
  _assert('all same digits',                   isValidPhone('000-000-0000'),  true);

  // invalid – missing dashes
  _assert('no dashes is rejected',             isValidPhone('1234567890'),    false);
  _assert('spaces instead of dashes',          isValidPhone('123 456 7890'),  false);
  _assert('dots instead of dashes',            isValidPhone('123.456.7890'),  false);

  // invalid – wrong segment lengths
  _assert('2-digit area code is rejected',     isValidPhone('12-345-6789'),   false);
  _assert('4-digit area code is rejected',     isValidPhone('1234-56-7890'),  false);
  _assert('only 3 final digits is rejected',   isValidPhone('123-456-789'),   false);
  _assert('5 final digits is rejected',        isValidPhone('123-456-78901'), false);

  // invalid – letters
  _assert('letters are rejected',              isValidPhone('abc-def-ghij'),  false);

  // invalid – empty
  _assert('empty string is rejected',          isValidPhone(''),              false);
}

// ---------------------------------------------------------------------------
// 3. isNonEmpty
// ---------------------------------------------------------------------------

function testIsNonEmpty() {
  _group('isNonEmpty');

  _assert('non-empty word',                    isNonEmpty('John'),       true);
  _assert('word with surrounding spaces',      isNonEmpty('  Jane  '),   true);
  _assert('single character',                  isNonEmpty('A'),          true);

  _assert('empty string is rejected',          isNonEmpty(''),           false);
  _assert('only spaces is rejected',           isNonEmpty('   '),        false);
  _assert('only tabs is rejected',             isNonEmpty('\t\t'),       false);
  _assert('only newlines is rejected',         isNonEmpty('\n\n'),       false);
}

// ---------------------------------------------------------------------------
// 4. isAfterTodayEST
// ---------------------------------------------------------------------------

function testIsAfterTodayEST() {
  _group('isAfterTodayEST');

  _assert('tomorrow is valid',                 isAfterTodayEST(_estDateOffset(1)),   true);
  _assert('one year from now is valid',        isAfterTodayEST(_estDateOffset(365)), true);

  _assert('today is rejected',                 isAfterTodayEST(_estDateOffset(0)),   false);
  _assert('yesterday is rejected',             isAfterTodayEST(_estDateOffset(-1)),  false);
  _assert('one year ago is rejected',          isAfterTodayEST(_estDateOffset(-365)), false);

  _assert('empty string is rejected',          isAfterTodayEST(''),               false);
  _assert('null-like empty value rejected',    isAfterTodayEST(undefined),        false);
}

// ---------------------------------------------------------------------------
// 5. Submit button requires ALL fields to be valid
// ---------------------------------------------------------------------------

/**
 * Sets a form field's value and fires the 'input' (or 'change') event so that
 * the live validation listeners in validation.js pick up the new value.
 */
function _setField(el, value, eventName = 'input') {
  el.value = value;
  el.dispatchEvent(new Event(eventName, { bubbles: true }));
}

/**
 * Simulates blurring every field in the correct order so the "touched" guard
 * inside validation.js is lifted, then verifies that the submit button is
 * disabled when one or more fields are invalid.
 */
function testSubmitButtonRequiresAllFields() {
  _group('Submit button – requires ALL fields to be valid');

  // Resolve elements by ID to avoid relying on variables from validation.js
  const _firstName  = document.getElementById('firstName');
  const _lastName   = document.getElementById('lastName');
  const _email      = document.getElementById('email');
  const _phone      = document.getElementById('phone');
  const _eventDate  = document.getElementById('eventDate');
  const _submitBtn  = document.getElementById('submitBtn');

  const FUTURE_DATE  = _estDateOffset(7);
  const VALID_DATA   = {
    firstName : 'Jane',
    lastName  : 'Doe',
    email     : 'jd123456@ucf.edu',
    phone     : '407-555-1234',
    eventDate : FUTURE_DATE,
  };

  /** Shorthand: fill every field with valid data then override specific ones */
  function fillForm(overrides = {}) {
    const data = Object.assign({}, VALID_DATA, overrides);

    _setField(_firstName,  data.firstName);
    _setField(_lastName,   data.lastName);
    _setField(_email,      data.email);
    _setField(_phone,      data.phone);
    _setField(_eventDate,  data.eventDate, 'change');

    // Blur all fields so "touched" flags are set and errors/button are refreshed
    [_firstName, _lastName, _email, _phone, _eventDate]
      .forEach((el) => el.dispatchEvent(new Event('blur', { bubbles: true })));
  }

  // --- All fields valid → button should be ENABLED ---
  fillForm();
  _assert('all fields valid → button enabled', _submitBtn.disabled, false);

  // --- One field blank at a time → button must be DISABLED ---
  fillForm({ firstName: '' });
  _assert('blank first name → button disabled', _submitBtn.disabled, true);

  fillForm({ lastName: '' });
  _assert('blank last name → button disabled', _submitBtn.disabled, true);

  fillForm({ email: '' });
  _assert('blank email → button disabled', _submitBtn.disabled, true);

  fillForm({ phone: '' });
  _assert('blank phone → button disabled', _submitBtn.disabled, true);

  fillForm({ eventDate: '' });
  _assert('blank event date → button disabled', _submitBtn.disabled, true);

  // --- Invalid (not just blank) values → button must still be DISABLED ---
  fillForm({ email: 'notanemail@gmail.com' });
  _assert('invalid email → button disabled', _submitBtn.disabled, true);

  fillForm({ phone: '4075551234' });
  _assert('phone without dashes → button disabled', _submitBtn.disabled, true);

  fillForm({ eventDate: _estDateOffset(0) });
  _assert('date = today → button disabled', _submitBtn.disabled, true);

  fillForm({ eventDate: _estDateOffset(-1) });
  _assert('past date → button disabled', _submitBtn.disabled, true);

  // --- Three of five fields valid → button must be DISABLED ---
  fillForm({ email: 'bad-email', phone: 'bad-phone' });
  _assert('3/5 fields valid → button disabled', _submitBtn.disabled, true);

  // --- Restore form to all-valid state ---
  fillForm();
}

// ---------------------------------------------------------------------------
// Entry point – run all test groups and render the report
// ---------------------------------------------------------------------------

function runTests() {
  testIsValidUCFEmail();
  testIsValidPhone();
  testIsNonEmpty();
  testIsAfterTodayEST();
  testSubmitButtonRequiresAllFields();

  // ---------- Render results to the page ----------
  const container = document.getElementById('test-output');
  if (!container) return;

  let currentGroup = '';
  let passed = 0;
  let failed = 0;

  _results.forEach((r) => {
    if (r.group !== undefined) {
      currentGroup = r.group;
      const h = document.createElement('h3');
      h.textContent = currentGroup;
      container.appendChild(h);
      return;
    }

    const div = document.createElement('div');
    div.className = r.passed ? 'pass' : 'fail';
    div.textContent = (r.passed ? '✓ ' : '✗ ') + r.description;
    if (!r.passed) {
      div.textContent += `  (expected: ${r.expected}, got: ${r.actual})`;
    }
    container.appendChild(div);

    r.passed ? passed++ : failed++;
  });

  const summary = document.createElement('p');
  summary.id = 'summary';
  summary.textContent = `${passed + failed} tests run — ${passed} passed, ${failed} failed.`;
  summary.style.fontWeight = 'bold';
  summary.style.color = failed === 0 ? 'green' : 'red';
  container.insertBefore(summary, container.firstChild);

  console.info(`Tests complete: ${passed} passed, ${failed} failed.`);
}

runTests();
