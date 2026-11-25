/* Riverbend Yoga Studio - Touchstone 4 JavaScript
   1. Class & Session Finder (services.html): filter by goal, save a preferred class
   2. Spot-request form validation (events.html)
   3. localStorage: preferred class, last filter, last request (pre-fills the form) */

"use strict";

/* ==========================================================
   DATA (arrays and objects)
   ========================================================== */

const STORAGE_KEYS = {
  preferredClass: "riverbend_preferred_class",
  lastFilter: "riverbend_last_filter",
  lastRequest: "riverbend_last_request"
};

// Each id matches a value in the #program-interest dropdown on events.html
const CLASS_OFFERINGS = [
  {
    id: "gentle-foundations",
    title: "Gentle & Chair-Supported Yoga",
    category: "beginner",
    description: "Slow, low-impact movement for joint mobility, balance, and breath. Ideal for beginners and older adults.",
    schedule: "Mon & Wed 9:30 AM; Tue & Thu 10:30 AM",
    price: "$18 drop-in"
  },
  {
    id: "vinyasa-flow",
    title: "Mindful Vinyasa Flow",
    category: "desk",
    description: "Steady, breath-linked sequences that build posture and focus and release desk-related tension.",
    schedule: "Mon & Wed 5:30 PM; Fri 12:00 PM; Sat & Sun 9:00 AM",
    price: "$18 drop-in"
  },
  {
    id: "restorative",
    title: "Restorative Yoga & Breathwork",
    category: "relax",
    description: "Supported floor poses held for several minutes to calm the nervous system and deepen relaxation.",
    schedule: "Tue & Thu 6:30 PM; Sat & Sun 4:00 PM",
    price: "$18 drop-in"
  },
  {
    id: "private-session",
    title: "Private One-on-One Session",
    category: "beginner",
    description: "60 minutes with a certified instructor on a sequence built around your comfort level and goals.",
    schedule: "By appointment",
    price: "$75 single or $200 for 3 sessions"
  }
];

// Tips shown under the program dropdown on events.html
const PROGRAM_NOTES = {
  "gentle-foundations": "Wear comfortable clothes. Chairs, bolsters, and blocks are provided, so no experience is needed.",
  "vinyasa-flow": "Bring water and arrive 10 minutes early so an instructor can suggest modifications.",
  "restorative": "Wear warm layers. Blankets and bolsters are provided for long, comfortable holds.",
  "private-session": "Tell us your goals or accommodations in the message box so your instructor can plan ahead.",
  "workshop-beginners": "Perfect for first-timers. Arrive 10 minutes early to set up your props. Held the first Saturday, 1:00 PM.",
  "workshop-back-relief": "Wear loose clothing you can stretch in. Held the second Sunday, 2:00 PM.",
  "workshop-balance": "Chair support is provided. Held the fourth Saturday, 11:00 AM."
};

/* ==========================================================
   HELPERS
   ========================================================== */

function readStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null; // storage blocked or corrupted: fall back to defaults
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    /* nothing to do */
  }
}

function createEl(tag, text, className) {
  const el = document.createElement(tag);
  if (text) el.textContent = text;
  if (className) el.className = className;
  return el;
}

function findOffering(id) {
  return CLASS_OFFERINGS.find(function (offering) {
    return offering.id === id;
  });
}

/* ==========================================================
   FEATURE: CLASS & SESSION FINDER (services.html)
   ========================================================== */

let activeFilter = "all";

function getFilteredOfferings(filterId) {
  if (filterId === "all") return CLASS_OFFERINGS;
  return CLASS_OFFERINGS.filter(function (offering) {
    return offering.category === filterId;
  });
}

function buildClassCard(offering, isSaved) {
  const card = createEl("article");
  card.appendChild(createEl("h3", offering.title));
  card.appendChild(createEl("p", offering.description));

  const schedule = createEl("p");
  schedule.appendChild(createEl("strong", "Schedule: "));
  schedule.appendChild(document.createTextNode(offering.schedule));
  card.appendChild(schedule);

  const price = createEl("p");
  price.appendChild(createEl("strong", "Price: "));
  price.appendChild(document.createTextNode(offering.price));
  card.appendChild(price);

  const button = createEl("button", isSaved ? "\u2713 Saved as Preferred Class" : "Save as Preferred Class");
  button.type = "button";
  button.dataset.classId = offering.id;
  button.setAttribute("aria-pressed", String(isSaved));
  card.appendChild(button);

  return card;
}

function renderClassCards(filterId) {
  const container = document.getElementById("class-finder-results");
  const status = document.getElementById("filter-status");
  if (!container) return;

  const matches = getFilteredOfferings(filterId);
  const saved = readStorage(STORAGE_KEYS.preferredClass);
  const savedId = saved ? saved.id : null;

  container.textContent = "";
  matches.forEach(function (offering) {
    container.appendChild(buildClassCard(offering, offering.id === savedId));
  });

  const activeButton = document.querySelector('[data-filter="' + filterId + '"]');
  const label = activeButton ? activeButton.textContent : "All Offerings";
  status.textContent = "Showing " + matches.length + " of " + CLASS_OFFERINGS.length +
    " offerings: " + label + ".";
}

function setActiveFilter(filterId) {
  activeFilter = filterId;
  document.querySelectorAll("[data-filter]").forEach(function (button) {
    button.setAttribute("aria-pressed", String(button.dataset.filter === filterId));
  });
  writeStorage(STORAGE_KEYS.lastFilter, filterId);
  renderClassCards(filterId);
}

function updateSavedClassBanner() {
  const banner = document.getElementById("saved-class-banner");
  if (!banner) return;

  const saved = readStorage(STORAGE_KEYS.preferredClass);
  const offering = saved ? findOffering(saved.id) : null;
  banner.textContent = "";

  if (!offering) {
    banner.hidden = true;
    return;
  }

  banner.appendChild(createEl("strong", "Saved: "));
  banner.appendChild(document.createTextNode(offering.title + ". It will be pre-selected on the registration form. "));

  const link = createEl("a", "Request a spot");
  link.href = "events.html";
  banner.appendChild(link);
  banner.appendChild(document.createTextNode(" "));

  const removeButton = createEl("button", "Remove", "link-button");
  removeButton.type = "button";
  removeButton.dataset.action = "remove-saved";
  banner.appendChild(removeButton);

  banner.hidden = false;
}

function savePreferredClass(id) {
  writeStorage(STORAGE_KEYS.preferredClass, { id: id, savedAt: new Date().toISOString() });
  updateSavedClassBanner();
  renderClassCards(activeFilter);
  const button = document.querySelector('[data-class-id="' + id + '"]');
  if (button) button.focus(); // keep keyboard focus after re-render
}

function removePreferredClass() {
  removeStorage(STORAGE_KEYS.preferredClass);
  updateSavedClassBanner();
  renderClassCards(activeFilter);
}

function initClassFinder() {
  const finder = document.getElementById("class-finder");
  if (!finder) return;

  finder.addEventListener("click", function (event) {
    const filterButton = event.target.closest("[data-filter]");
    const saveButton = event.target.closest("[data-class-id]");
    const removeButton = event.target.closest('[data-action="remove-saved"]');

    if (filterButton) setActiveFilter(filterButton.dataset.filter);
    else if (saveButton) savePreferredClass(saveButton.dataset.classId);
    else if (removeButton) removePreferredClass();
  });

  // Restore the last filter the visitor used
  const storedFilter = readStorage(STORAGE_KEYS.lastFilter);
  const validFilter = document.querySelector('[data-filter="' + storedFilter + '"]');
  setActiveFilter(validFilter ? storedFilter : "all");
  updateSavedClassBanner();
}

/* ==========================================================
   FORM VALIDATION (events.html)
   ========================================================== */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// One rule per field: returns an error message, or "" when the value is valid
const FIELD_RULES = {
  "student-name": function (value) {
    const name = value.trim();
    if (!name) return "Please enter your full name.";
    if (name.length < 2) return "Your name must be at least 2 characters.";
    if (name.length > 60) return "Your name must be 60 characters or fewer.";
    return "";
  },

  "student-email": function (value) {
    const email = value.trim();
    if (!email) return "Please enter your email address.";
    if (!EMAIL_PATTERN.test(email)) return "Please enter a valid email address (for example, jordan@example.com).";
    return "";
  },

  "student-phone": function (value, form) {
    const phone = value.trim();
    const method = form.elements["preferred_contact"].value;
    const needsPhone = method === "phone" || method === "text";
    const digits = phone.replace(/\D/g, "");

    if (!phone) {
      return needsPhone ? "Please enter a 10-digit phone number when selecting Phone Call or Text Message." : "";
    }
    if (/[^0-9+()\-\s]/.test(phone)) return "Use only digits, spaces, dashes, plus signs, or parentheses.";
    if (needsPhone && digits.length !== 10) {
      return "Please enter a 10-digit phone number when selecting Phone Call or Text Message.";
    }
    return "";
  },

  "preferred-contact": function (value) {
    return value ? "" : "Please choose how you would like us to contact you.";
  },

  "program-interest": function (value) {
    return value ? "" : "Please select a class or workshop.";
  },

  "experience-level": function (value) {
    return value ? "" : "Please select your experience level.";
  },

  "student-message": function (value) {
    const message = value.trim();
    if (message && message.length < 10) return "Please write at least 10 characters, or leave this blank.";
    if (message.length > 500) return "Please keep your message to 500 characters or fewer.";
    return "";
  }
};

function showFieldError(field, message) {
  let error = document.getElementById(field.id + "-error");
  if (!error) {
    error = createEl("p", "", "error-message");
    error.id = field.id + "-error";
    error.setAttribute("role", "alert");
    field.insertAdjacentElement("afterend", error);
  }
  error.textContent = message;
  field.setAttribute("aria-invalid", "true");
  field.setAttribute("aria-describedby", error.id);
  field.classList.add("field-invalid");
}

function clearFieldError(field) {
  const error = document.getElementById(field.id + "-error");
  if (error) error.remove();
  field.removeAttribute("aria-invalid");
  field.removeAttribute("aria-describedby");
  field.classList.remove("field-invalid");
}

function validateField(field, form) {
  const rule = FIELD_RULES[field.id];
  if (!rule) return true;
  const message = rule(field.value, form);
  if (message) {
    showFieldError(field, message);
    return false;
  }
  clearFieldError(field);
  return true;
}

function validateSpotForm(form) {
  let firstInvalid = null;
  Object.keys(FIELD_RULES).forEach(function (id) {
    const field = document.getElementById(id);
    if (field && !validateField(field, form) && !firstInvalid) firstInvalid = field;
  });
  if (firstInvalid) firstInvalid.focus();
  return firstInvalid === null;
}

function showFormStatus(message, isError) {
  const status = document.getElementById("form-status");
  if (!status) return;
  status.textContent = message;
  status.className = "form-status " + (isError ? "form-status-error" : "form-status-success");
  status.hidden = !message;
}

/* ==========================================================
   BROWSER STORAGE FOR THE FORM (events.html)
   ========================================================== */

function getOptionLabel(selectId, value) {
  const select = document.getElementById(selectId);
  const option = select ? select.querySelector('option[value="' + value + '"]') : null;
  return option ? option.textContent : "";
}

function saveLastRequest(form) {
  const request = {
    name: form.elements["student_name"].value.trim(),
    email: form.elements["student_email"].value.trim(),
    phone: form.elements["student_phone"].value.trim(),
    experience: form.elements["experience_level"].value,
    program: form.elements["program_interest"].value,
    savedAt: new Date().toISOString()
  };
  writeStorage(STORAGE_KEYS.lastRequest, request);

  // A chosen group class or private session also becomes the preferred class
  if (findOffering(request.program)) {
    writeStorage(STORAGE_KEYS.preferredClass, { id: request.program, savedAt: request.savedAt });
  }
}

function updateProgramNote() {
  const select = document.getElementById("program-interest");
  const note = document.getElementById("program-note");
  if (!select || !note) return;

  const text = PROGRAM_NOTES[select.value] || "";
  note.textContent = text ? "Preparation tip: " + text : "";
  note.hidden = !text;
}

function showWelcomeBanner(request, preferredId) {
  const banner = document.getElementById("welcome-back-banner");
  if (!banner) return;
  banner.textContent = "";

  if (request) {
    const firstName = request.name ? request.name.split(" ")[0] : "";
    const programLabel = getOptionLabel("program-interest", request.program);
    const date = new Date(request.savedAt).toLocaleDateString();
    let summary = "Welcome back" + (firstName ? ", " + firstName : "") + ". Your last request" +
      (programLabel ? " was for " + programLabel : "") + " (" + date + "). We pre-filled your details.";
    banner.appendChild(document.createTextNode(summary + " "));
  } else {
    const offering = findOffering(preferredId);
    banner.appendChild(document.createTextNode("Your preferred class, " + offering.title + ", is selected below. "));
  }

  const clearButton = createEl("button", "Clear saved info", "link-button");
  clearButton.type = "button";
  clearButton.dataset.action = "clear-saved";
  banner.appendChild(clearButton);
  banner.hidden = false;
}

function restoreSavedRegistrationData() {
  const form = document.getElementById("spot-request-form");
  if (!form) return;

  const request = readStorage(STORAGE_KEYS.lastRequest);
  const preferred = readStorage(STORAGE_KEYS.preferredClass);
  const preferredId = preferred && findOffering(preferred.id) ? preferred.id : "";

  if (request) {
    const fills = [
      ["student-name", request.name],
      ["student-email", request.email],
      ["student-phone", request.phone],
      ["experience-level", request.experience]
    ];
    fills.forEach(function (pair) {
      const field = document.getElementById(pair[0]);
      if (field && !field.value && pair[1]) field.value = pair[1];
    });
  }

  // A class saved on services.html wins over the program from the last request
  const programSelect = document.getElementById("program-interest");
  const programToUse = preferredId || (request ? request.program : "");
  if (programSelect && !programSelect.value && programToUse) programSelect.value = programToUse;

  updateProgramNote();
  if (request || preferredId) showWelcomeBanner(request, preferredId);
}

function clearSavedRegistrationData(form) {
  removeStorage(STORAGE_KEYS.lastRequest);
  removeStorage(STORAGE_KEYS.preferredClass);
  form.reset();
  Object.keys(FIELD_RULES).forEach(function (id) {
    const field = document.getElementById(id);
    if (field) clearFieldError(field);
  });
  document.getElementById("welcome-back-banner").hidden = true;
  updateProgramNote();
  showFormStatus("Saved information cleared.", false);
}

function initRegistrationForm() {
  const form = document.getElementById("spot-request-form");
  if (!form) return;

  // Custom messages replace the browser's pop-ups; HTML attributes remain as a no-JS fallback
  form.setAttribute("novalidate", "");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    form.dataset.attempted = "true";

    if (!validateSpotForm(form)) {
      showFormStatus("Please fix the highlighted fields and try again.", true);
      return;
    }

    saveLastRequest(form);
    showWelcomeBanner(readStorage(STORAGE_KEYS.lastRequest), "");
    showFormStatus("Thank you! Your request was received. A coordinator will reply within one business day.", false);
  });

  // After the first submit attempt, re-check fields as the visitor corrects them
  form.addEventListener("input", function (event) {
    if (form.dataset.attempted === "true" && FIELD_RULES[event.target.id]) {
      validateField(event.target, form);
    }
  });

  form.addEventListener("change", function (event) {
    if (event.target.id === "program-interest") updateProgramNote();
    if (form.dataset.attempted === "true") {
      validateField(event.target, form);
      // The phone rule depends on the preferred contact method
      if (event.target.id === "preferred-contact") {
        validateField(document.getElementById("student-phone"), form);
      }
    }
  });

  document.getElementById("welcome-back-banner").addEventListener("click", function (event) {
    if (event.target.closest('[data-action="clear-saved"]')) clearSavedRegistrationData(form);
  });

  restoreSavedRegistrationData();
}

/* ==========================================================
   INITIALIZATION
   ========================================================== */

document.addEventListener("DOMContentLoaded", function () {
  initClassFinder();
  initRegistrationForm();
});
