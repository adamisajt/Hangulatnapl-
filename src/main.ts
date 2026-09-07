//https://retoolapi.dev/WerbCz/data
const API_URL = 'https://retoolapi.dev/WerbCz/data';

const form = document.querySelector<HTMLFormElement>('#entryForm');
const descriptionInput = document.querySelector<HTMLTextAreaElement>('#description');
const messageContainer = document.querySelector<HTMLDivElement>('#message');
const saveButton = document.querySelector<HTMLButtonElement>('#saveButton');
//uzenet megjelenites
function showMessage(type: 'success' | 'danger', text: string): void {
  if (!messageContainer) return;

  messageContainer.innerHTML = `
    <div class="alert alert-${type}" role="alert">
      ${text}
    </div>
  `;
}
//unknown error type
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'ismeretlen hiba tortent';
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const leiras = descriptionInput?.value.trim() ?? '';
//leiras ellenorzes
  if (leiras.length === 0) {
    showMessage('danger', 'Kerlek adj meg egy rovid szoveges leirast!');
    descriptionInput?.focus();
    return;
  }

  if (leiras.length > 500) {
    showMessage('danger', 'A leiras maximum 500 karakter lehet.');
    return;
  }
//mentes
  try {
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.textContent = 'Mentés folyamatban...';
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        datum: new Date().toISOString(),
        leiras,
      }),
    });

    if (!response.ok) {
      throw new Error(`API hiba: ${response.status}`);
    }
//sikeres mentés
    form.reset();
    showMessage('success', 'A bejegyzés sikeresen elmentve!');
  } catch (error) {
    showMessage('danger', `A mentés nem sikerült: ${getErrorMessage(error)}`);
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = 'Bejegyzés mentése';
    }
  }
});