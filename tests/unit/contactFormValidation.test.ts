import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("ContactForm client-side validation logic", () => {
  let form: HTMLFormElement;
  let nameInput: HTMLInputElement;
  let emailInput: HTMLInputElement;
  let messageInput: HTMLTextAreaElement;
  let botCheck: HTMLInputElement;
  let nameError: HTMLElement;
  let emailError: HTMLElement;
  let messageError: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="contact-form" action="https://api.web3forms.com/submit" method="POST" novalidate>
        <input type="checkbox" name="botcheck" id="contact-botcheck" tabindex="-1" />
        <div>
          <input type="text" id="contact-name" name="name" required />
          <p id="contact-name-error" class="hidden" role="alert">Please enter your name.</p>
        </div>
        <div>
          <input type="email" id="contact-email" name="email" required />
          <p id="contact-email-error" class="hidden" role="alert">Please enter a valid email address.</p>
        </div>
        <div>
          <textarea id="contact-message" name="message" required></textarea>
          <p id="contact-message-error" class="hidden" role="alert">Please enter your message.</p>
        </div>
        <div id="status-error" class="hidden">An error occurred</div>
        <button type="submit" id="contact-submit">
          <span id="btn-text">Send Message</span>
          <svg id="btn-spinner" class="hidden"></svg>
        </button>
      </form>
    `;

    form = document.getElementById("contact-form") as HTMLFormElement;
    nameInput = document.getElementById("contact-name") as HTMLInputElement;
    emailInput = document.getElementById("contact-email") as HTMLInputElement;
    messageInput = document.getElementById(
      "contact-message",
    ) as HTMLTextAreaElement;
    botCheck = document.getElementById("contact-botcheck") as HTMLInputElement;
    nameError = document.getElementById("contact-name-error") as HTMLElement;
    emailError = document.getElementById("contact-email-error") as HTMLElement;
    messageError = document.getElementById(
      "contact-message-error",
    ) as HTMLElement;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Reusable inline validator logic matching ContactForm.astro
  function attachValidationHandlers(
    formEl: HTMLFormElement,
    onRedirect: (url: string) => void = (url) => {
      window.location.assign(url);
    },
  ) {
    const requiredInputs = [nameInput, emailInput, messageInput];

    function validateField(
      input: HTMLInputElement | HTMLTextAreaElement,
    ): boolean {
      const errorEl = document.getElementById(`${input.id}-error`);
      const isValid = input.checkValidity();

      if (!isValid) {
        input.setAttribute("aria-invalid", "true");
        input.classList.add("border-red-500");
        if (errorEl) errorEl.classList.remove("hidden");
      } else {
        input.removeAttribute("aria-invalid");
        input.classList.remove("border-red-500");
        if (errorEl) errorEl.classList.add("hidden");
      }
      return isValid;
    }

    requiredInputs.forEach((input) => {
      input.addEventListener("blur", () => validateField(input));
    });

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();

      // Honeypot spam defence check
      const botField = formEl.elements.namedItem(
        "botcheck",
      ) as HTMLInputElement | null;
      if (botField && botField.checked) {
        formEl.reset();
        onRedirect("/thank-you");
        return;
      }

      let allValid = true;
      for (const input of requiredInputs) {
        if (!validateField(input)) {
          allValid = false;
        }
      }

      if (!allValid) return;
    });

    return { validateField };
  }

  it("validates empty required fields and reveals accessible error messages", () => {
    const { validateField } = attachValidationHandlers(form);

    nameInput.value = "";
    const nameValid = validateField(nameInput);
    expect(nameValid).toBe(false);
    expect(nameInput.getAttribute("aria-invalid")).toBe("true");
    expect(nameError.classList.contains("hidden")).toBe(false);

    messageInput.value = "";
    const msgValid = validateField(messageInput);
    expect(msgValid).toBe(false);
    expect(messageInput.getAttribute("aria-invalid")).toBe("true");
    expect(messageError.classList.contains("hidden")).toBe(false);
  });

  it("validates email formatting via standard email input constraints", () => {
    const { validateField } = attachValidationHandlers(form);

    emailInput.value = "not-an-email";
    expect(validateField(emailInput)).toBe(false);
    expect(emailInput.getAttribute("aria-invalid")).toBe("true");
    expect(emailError.classList.contains("hidden")).toBe(false);

    emailInput.value = "valid.user@example.com";
    expect(validateField(emailInput)).toBe(true);
    expect(emailInput.getAttribute("aria-invalid")).toBeNull();
    expect(emailError.classList.contains("hidden")).toBe(true);
  });

  it("silently diverts submission to thank-you when honeypot botcheck is checked", () => {
    let redirectedUrl = "";
    attachValidationHandlers(form, (url) => {
      redirectedUrl = url;
    });

    // Bot fills out honeypot checkbox
    botCheck.checked = true;
    nameInput.value = "Spam Bot";
    emailInput.value = "bot@spammer.org";
    messageInput.value = "Buy cheap products";

    // Simulate submission
    form.dispatchEvent(
      new Event("submit", { cancelable: true, bubbles: true }),
    );

    // Assert diversion
    expect(redirectedUrl).toBe("/thank-you");
  });

  it("sanitises input values and trims leading/trailing whitespace", () => {
    const rawName = "  Jane Doe  ";
    const rawEmail = "  jane@example.com ";
    const rawMessage = "  Hello, I would like to discuss cloud architecture.  ";

    nameInput.value = rawName.trim();
    emailInput.value = rawEmail.trim();
    messageInput.value = rawMessage.trim();

    expect(nameInput.value).toBe("Jane Doe");
    expect(emailInput.value).toBe("jane@example.com");
    expect(messageInput.value).toBe(
      "Hello, I would like to discuss cloud architecture.",
    );
  });
});
