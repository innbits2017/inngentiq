(function () {
  const currentScript = document.currentScript;

  if (!currentScript) {
    console.error("Inngentiq: Script not found.");
    return;
  }

  const agentId = currentScript.getAttribute("data-agent");

  if (!agentId) {
    console.error("Inngentiq: Missing data-agent.");
    return;
  }

  fetch(`/api/public/widget/${agentId}`)
    .then((res) => res.json())
    .then((data) => {
      console.log("Widget Config", data);

      const launcher = document.createElement("div");

      launcher.innerHTML = "💬";

      launcher.style.position = "fixed";
      launcher.style.bottom = "24px";
      launcher.style.right = "24px";
      launcher.style.width = "64px";
      launcher.style.height = "64px";
      launcher.style.borderRadius = "50%";
      launcher.style.background = data.widget.primary_color;
      launcher.style.color = data.widget.text_color;
      launcher.style.display = "flex";
      launcher.style.alignItems = "center";
      launcher.style.justifyContent = "center";
      launcher.style.cursor = "pointer";
      launcher.style.fontSize = "28px";
      launcher.style.boxShadow = "0 10px 30px rgba(0,0,0,.25)";
      launcher.style.zIndex = "999999";

      document.body.appendChild(launcher);
    })
    .catch(console.error);
})();