interface Entry {
  id: number;
  datum: string;
  leiras: string;
  hangulat: string;
}

declare const bootstrap: {
  Modal: {
    getOrCreateInstance(element: Element): {
      show: () => void;
      hide: () => void;
    };
  };
};

const API_URL = 'https://retoolapi.dev/WerbCz/data';
let entries: Entry[] = [];

const entriesBody = document.querySelector<HTMLTableSectionElement>('#entriesBody');
const UzenetContainer = document.querySelector<HTMLDivElement>('#UzenetContainer');
const editForm = document.querySelector<HTMLFormElement>('#editForm');
const editIdInput = document.querySelector<HTMLInputElement>('#editId');
const editDateInput = document.querySelector<HTMLInputElement>('#editDate');
const editMoodInput = document.querySelector<HTMLInputElement>('#editMood');
const editDescriptionInput = document.querySelector<HTMLTextAreaElement>('#editDescription');
const modalUzenet = document.querySelector<HTMLDivElement>('#modalUzenet');
const updateButton = document.querySelector<HTMLButtonElement>('#updateButton');
const deleteIdInput = document.querySelector<HTMLInputElement>('#deleteId');
const confirmDeleteButton = document.querySelector<HTMLButtonElement>('#confirmDeleteButton');
const editModalElement = document.querySelector<HTMLDivElement>('#editModal');
const deleteModalElement = document.querySelector<HTMLDivElement>('#deleteModal');

const editModal = editModalElement ? bootstrap.Modal.getOrCreateInstance(editModalElement) : null;
const deleteModal = deleteModalElement ? bootstrap.Modal.getOrCreateInstance(deleteModalElement) : null;

function escapeHtml(value: string): string {
  const element = document.createElement('div');
  element.textContent = value;
  return element.innerHTML;
}
//datum formatalas
function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }
//ezt tatltam interneten a magyar datum formatalashoz
  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
//uzenet megjelenites
function showUzenet(type: 'success' | 'danger', text: string): void {
  if (!UzenetContainer) return;
  UzenetContainer.innerHTML = `<div class="alert alert-${type}" role="alert">${text}</div>`;
}
//unknown error
function showModalUzenet(type: 'danger', text: string): void {
  if (!modalUzenet) return;
  modalUzenet.innerHTML = `<div class="alert alert-${type} mb-0" role="alert">${text}</div>`;
}
//uzenet torlese
function clearModalUzenet(): void {
  if (modalUzenet) modalUzenet.innerHTML = '';
}
//unknown error 
function getErrorUzenet(error: unknown): string {
  return error instanceof Error ? error.message : 'Ismeretlen hiba történt.';
}
//bejegyzesek betoltese
async function loadEntries(): Promise<void> {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`api hiba: ${response.status}`);
    }

    entries = await response.json() as Entry[];
    renderEntries();
  } catch (error) {
    if (entriesBody) {
      entriesBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-danger py-4">
            Nem sikerült betölteni a bejegyzéseket: ${escapeHtml(getErrorUzenet(error))}
          </td>
        </tr>
      `;
    }
  }
}
//bejegyzesek megjelenitese
function renderEntries(): void {
  if (!entriesBody) return;

  const sortedEntries = [...entries].sort((first, second) => {
    return new Date(second.datum).getTime() - new Date(first.datum).getTime();
  });

  if (sortedEntries.length === 0) {
    entriesBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-secondary py-4">Még nincs rögzített bejegyzés.</td>
      </tr>
    `;
    return;
  }
//bejegyzesek megjelenitese tablazatban8
  entriesBody.innerHTML = sortedEntries.map((entry) => `
    <tr>
      <td>${escapeHtml(formatDate(entry.datum))}</td>
      <td class="fs-4">${escapeHtml(entry.hangulat)}</td>
      <td>${escapeHtml(entry.leiras)}</td>
      <td class="text-end text-nowrap">
        <button class="btn btn-sm btn-outline-primary edit-button" data-id="${entry.id}">Módosítás</button>
        <button class="btn btn-sm btn-outline-danger delete-button" data-id="${entry.id}">Törlés</button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll<HTMLButtonElement>('.edit-button').forEach((button) => {
    button.addEventListener('click', () => openEditModal(Number(button.dataset.id)));
  });

  document.querySelectorAll<HTMLButtonElement>('.delete-button').forEach((button) => {
    button.addEventListener('click', () => openDeleteModal(Number(button.dataset.id)));
  });
}
//bejegyzes modositasa
function openEditModal(id: number): void {
  const entry = entries.find((item) => item.id === id);
  if (!entry) return;

  clearModalUzenet();
  if (editIdInput) editIdInput.value = String(entry.id);
  if (editDateInput) editDateInput.value = formatDate(entry.datum);
  if (editMoodInput) editMoodInput.value = entry.hangulat;
  if (editDescriptionInput) editDescriptionInput.value = entry.leiras;
  editModal?.show();
}
//bejegyzes torlese
function openDeleteModal(id: number): void {
  if (deleteIdInput) deleteIdInput.value = String(id);
  deleteModal?.show();
}
//megerositesre kerestem ra es a gemini valaszolt alapbol ezzel a "finally"-s megoldassal (try)
//modositas eseten a form submit event kezelese
editForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const id = Number(editIdInput?.value);
  const entry = entries.find((item) => item.id === id);
  const leiras = editDescriptionInput?.value.trim() ?? '';

  if (!entry) {
    showModalUzenet('danger', 'A módosítandó bejegyzés nem található.');
    return;
  }

  if (!leiras) {
    showModalUzenet('danger', 'A leírás kitöltése kötelező.');
    return;
  }

  try {
    if (updateButton) {
      updateButton.disabled = true;
      updateButton.textContent = 'Mentés...';
    }

    const response = await fetch(`${API_URL}/${entry.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: entry.id,
        datum: entry.datum,
        leiras,
        hangulat: entry.hangulat,
      }),
    });

    if (!response.ok) {
      throw new Error(`API hiba: ${response.status}`);
    }

    editModal?.hide();
    showUzenet('success', 'A bejegyzés sikeresen módosítva lett.');
    await loadEntries();
  } catch (error) {
    showModalUzenet('danger', `A módosítás nem sikerült: ${getErrorUzenet(error)}`);
  } finally {
    if (updateButton) {
      updateButton.disabled = false;
      updateButton.textContent = 'Módosítás mentése';
    }
  }
});



//-||-
//bejegyzes torlese eseten a click event kezelese
confirmDeleteButton?.addEventListener('click', async () => {
  const id = Number(deleteIdInput?.value);

  if (!id) return;

  try {
    confirmDeleteButton.disabled = true;
    confirmDeleteButton.textContent = 'Törlés...';

    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`API hiba: ${response.status}`);
    }

    deleteModal?.hide();
    showUzenet('success', 'A bejegyzés sikeresen törölve lett.');
    await loadEntries();
  } catch (error) {
    showUzenet('danger', `A törlés nem sikerült: ${getErrorUzenet(error)}`);
  } finally {
    confirmDeleteButton.disabled = false;
    confirmDeleteButton.textContent = 'Igen, törlés';
  }
});

void loadEntries();