(() => {
  const script = document.currentScript;
  const measurementId = (script?.dataset.measurementId || "").trim();
  const isConfigured = /^G-[A-Z0-9]+$/i.test(measurementId);
  const consentKey = "archident_cookie_consent";
  const isEnglish = (document.documentElement.lang || "").toLowerCase().startsWith("en");
  let analyticsLoaded = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  const getConsent = () => {
    try {
      return window.localStorage.getItem(consentKey);
    } catch {
      return null;
    }
  };

  const setConsent = (value) => {
    try {
      window.localStorage.setItem(consentKey, value);
    } catch {
      // If storage is unavailable, keep the decision only for the current page view.
    }
  };

  let consent = getConsent();
  let hasAnalyticsConsent = consent === "accepted";

  const loadAnalytics = () => {
    if (!isConfigured || analyticsLoaded || !hasAnalyticsConsent) return;
    analyticsLoaded = true;

    const gaScript = document.createElement("script");
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
      measurementId
    )}`;
    document.head.appendChild(gaScript);

    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      anonymize_ip: true,
      page_title: document.title,
      page_path: window.location.pathname + window.location.hash,
    });
  };

  const removeCookieNotice = () => {
    document.querySelector(".cookie-notice")?.remove();
  };

  const createCookieNotice = () => {
    if (getConsent()) return;

    const copy = isEnglish
      ? {
          ariaLabel: "Cookie notice",
          title: "Cookie and analytics notice",
          description:
            "If you accept, our website may use analytics cookies to measure visits and click performance. The name, surname, or complaint details you type into the appointment form are not sent to Analytics.",
          reject: "Decline",
          accept: "Accept",
        }
      : {
          ariaLabel: "Çerez bilgilendirmesi",
          title: "Çerez ve ölçüm bilgilendirmesi",
          description:
            "Web sitemizde, kabul etmeniz halinde ziyaret ve tıklama performansını ölçmek için analitik çerezler kullanılabilir. Randevu formuna yazdığınız ad, soyad veya şikayet bilgisi Analytics'e gönderilmez.",
          reject: "Reddet",
          accept: "Kabul Et",
        };

    const notice = document.createElement("aside");
    notice.className = "cookie-notice";
    notice.setAttribute("aria-label", copy.ariaLabel);
    notice.innerHTML = `
      <div>
        <strong>${copy.title}</strong>
        <p>${copy.description}</p>
      </div>
      <div class="cookie-actions">
        <button class="secondary" type="button" data-cookie-choice="rejected">${copy.reject}</button>
        <button class="primary" type="button" data-cookie-choice="accepted">${copy.accept}</button>
      </div>
    `;

    notice.addEventListener("click", (event) => {
      const button = event.target.closest("[data-cookie-choice]");
      if (!button) return;

      consent = button.dataset.cookieChoice;
      hasAnalyticsConsent = consent === "accepted";
      setConsent(consent);
      if (hasAnalyticsConsent) loadAnalytics();
      removeCookieNotice();
    });

    document.body.appendChild(notice);
  };

  const ready = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  };

  if (hasAnalyticsConsent) {
    loadAnalytics();
  } else {
    ready(createCookieNotice);
  }

  const inferEventName = (href) => {
    if (!href) return "";
    if (href.startsWith("tel:")) return "phone_click";
    if (href.startsWith("mailto:")) return "email_click";
    if (href.includes("wa.me")) return "whatsapp_click";
    if (href.includes("google.com/maps") || href.includes("maps.google.com")) return "map_click";
    if (href.includes("g.page") || href.includes("google.com/search")) return "google_review_click";
    if (href.includes("kvkk-aydinlatma-metni") || href.includes("privacy-notice")) return "privacy_click";
    if (
      href.includes("/hizmetler/") ||
      href.includes("hizmetler/") ||
      href.includes("/services/") ||
      href.includes("services/")
    ) {
      return "service_click";
    }
    return "";
  };

  const getLabel = (element) => {
    const explicitLabel = element.dataset.analyticsLabel;
    if (explicitLabel) return explicitLabel;
    return (
      element.textContent.replace(/\s+/g, " ").trim().slice(0, 120) ||
      element.getAttribute("aria-label") ||
      (isEnglish ? "Click" : "Tıklama")
    );
  };

  window.trackSiteEvent = (eventName, params = {}) => {
    if (!eventName || !isConfigured || !hasAnalyticsConsent) return;
    window.gtag("event", eventName, {
      event_category: "site_interaction",
      page_location: window.location.href,
      ...params,
    });
  };

  document.addEventListener("click", (event) => {
    const element = event.target.closest("a, button");
    if (!element) return;

    const href = element.href || "";
    const eventName = element.dataset.analyticsEvent || inferEventName(href);
    if (!eventName) return;

    window.trackSiteEvent(eventName, {
      event_label: getLabel(element),
      link_url: href,
    });
  });
})();
