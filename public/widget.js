(async function () {
  const script = document.currentScript;

  if (!script) return;

  const agentId = script.getAttribute("data-agent");

  if (!agentId) {
    console.error("Missing data-agent");
    return;
  }

  const res = await fetch(
    `/api/public/widget/${agentId}`
  );

  const json = await res.json();

  if (!json.success) {
    console.error(json.message);
    return;
  }

  console.log(json.widget);

  const root = document.createElement("div");

  root.id = "inngentiq-widget";

  document.body.appendChild(root);
})();