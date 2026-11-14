import "@fontsource-variable/inter";
import "./analytics.css";
import "./catalogue.css";
import "./market.css";
import "./storefront.css";
import "./styles.css";
import "./styles/blog.css";
import "./styles/content-settings.css";
import "./styles/home-content.css";
import "./styles/layout.css";
// Load only the selected language before UI modules evaluate their labels.
import { loadTranslations } from "./i18n";
loadTranslations()
  .then(() => import("./App"))
  .catch(() => {
    const root = document.getElementById("root");
    if (!root) return;
    const text = document.createElement("p");
    text.textContent =
      "Unable to load the store. Please check your connection and try again.";
    const button = document.createElement("button");
    button.textContent = "Try again";
    button.onclick = () => location.reload();
    root.replaceChildren(text, button);
  });
