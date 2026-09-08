const API_URL = 'https://retoolapi.dev/WerbCz/data';
const moods = ['😀', '😐', '😢', '😴', '😡'];

const statsBody = document.querySelector('#statsBody') as HTMLTableSectionElement;

async function loadStatistics() {
  const response = await fetch(API_URL);
  const entries = await response.json();

  const counts: Record<string, number> = {
    '😀': 0,
    '😐': 0,
    '😢': 0,
    '😴': 0,
    '😡': 0
  };

  entries.forEach((entry: any) => {
    counts[entry.hangulat]++;
  });

  statsBody.innerHTML = moods.map((mood) => `
    <tr>
      <td>${mood}</td>
      <td>${counts[mood]}</td>
    </tr>
  `).join('');
}

loadStatistics();