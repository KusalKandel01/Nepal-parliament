/* ============================================================
   downloads.js — powers downloads.html: wires up each download
   button to fetch + save the corresponding data file.
   ============================================================ */

document.querySelectorAll(".download-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    const file = btn.dataset.file;
    const name = btn.dataset.name;
    const originalLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = "…";
    try {
      const res = await fetch(file);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      APP.toast(`${name} डाउनलोड भयो`);
      APP.announce(`${name} डाउनलोड सम्पन्न भयो`);
    } catch (e) {
      APP.toast("डाउनलोड असफल भयो");
      APP.announce("डाउनलोड असफल भयो");
    } finally {
      btn.disabled = false;
      btn.textContent = originalLabel;
    }
  });
});
