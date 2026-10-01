export function downloadRecovery(title: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = `${title || "appunto"}.txt`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
