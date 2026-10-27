document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : event.target.parentElement;
  const button = target?.closest("[data-assistant-question]");
  if (!button) return;

  const panel = button.closest("[data-farm-assistant]");
  const input = panel?.querySelector('textarea[name="question"]');
  if (!input) return;

  input.value = button.dataset.assistantQuestion || "";
  input.focus();
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
});
