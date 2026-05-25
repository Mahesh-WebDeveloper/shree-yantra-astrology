(function () {
  const path = location.pathname.replace(/\\/g, "/");
  const go = (relativePath) => {
    location.href = new URL(relativePath, location.href).href;
  };

  const text = (node) => (node && node.textContent ? node.textContent.replace(/\s+/g, " ").trim().toLowerCase() : "");
  const closestTextButton = (target, phrase) => {
    const button = target.closest("button, a, .list-row, .nav-item");
    return button && text(button).includes(phrase) ? button : null;
  };

  document.addEventListener("click", function (event) {
    const target = event.target;

    if (path.includes("/welcome-page/")) {
      if (target.closest(".premium-badge")) {
        event.preventDefault();
        go("../subscribenow-page/index.html");
        return;
      }
      if (closestTextButton(target, "read full prediction") || closestTextButton(target, "view details")) {
        event.preventDefault();
        go("../daily-predication-page/index.html");
        return;
      }
      if (closestTextButton(target, "choghadiya")) {
        event.preventDefault();
        go("../choghadiya/index.html");
        return;
      }
      if (closestTextButton(target, "library")) {
        event.preventDefault();
        go("../library/index.html");
        return;
      }
      if (closestTextButton(target, "manage subscription") || closestTextButton(target, "premium member")) {
        event.preventDefault();
        go("../subscribenow-page/index.html");
        return;
      }
      if (closestTextButton(target, "my profile") || closestTextButton(target, "profile")) {
        event.preventDefault();
        go("../profile-page/index.html");
        return;
      }
    }

    if (path.includes("/daily-predication-page/")) {
      if (target.closest(".back-button")) {
        event.preventDefault();
        go("../welcome-page/index.html");
        return;
      }
      if (target.closest(".premium-button")) {
        event.preventDefault();
        go("../subscribenow-page/index.html");
        return;
      }
    }

    if (path.includes("/profile-page/")) {
      if (target.closest(".topbar .icon-btn[aria-label='Back']")) {
        event.preventDefault();
        go("../welcome-page/index.html");
        return;
      }
      if (closestTextButton(target, "manage subscription")) {
        event.preventDefault();
        go("../subscribenow-page/index.html");
        return;
      }
      if (target.closest(".logout")) {
        event.preventDefault();
        go("../welcome-page/index.html");
        return;
      }
    }

    if (path.includes("/subscribenow-page/")) {
      if (target.closest(".sy-cta")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        go("../subscription-activated/index.html");
      }
    }

    if (path.includes("/subscription-activated/")) {
      if (target.closest(".btn--primary")) {
        event.preventDefault();
        go("../welcome-page/index.html");
        return;
      }
      if (target.closest(".btn--ghost")) {
        event.preventDefault();
        go("../subscribenow-page/index.html");
      }
    }
  }, true);
})();
