const pieOptions = document.getElementById('pieOptions');

function wedgePath(cx, cy, radius, startAngle, endAngle) {
  const point = angle => {
    const radians = angle * Math.PI / 180;
    return [cx + radius * Math.cos(radians), cy + radius * Math.sin(radians)];
  };
  const [x1, y1] = point(startAngle);
  const [x2, y2] = point(endAngle);
  return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
}

const pieAnswers = [
  { label: 'A', shaded: [0, 1, 2, 3, 4] },
  { label: 'B', shaded: [0, 2, 4, 6] },
  { label: 'C', shaded: [1, 2] },
  { label: 'D', shaded: [0, 3, 5] }
];

pieAnswers.forEach(({ label, shaded }) => {
  const choice = document.createElement('label');
  choice.className = 'pie-choice';
  choice.innerHTML = `<input type="radio" name="q1" aria-label="Pilihan ${label}"><span>${label}.</span>`;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Lingkaran dibagi 8 bagian, ${shaded.length} bagian diarsir`);

  for (let i = 0; i < 8; i++) {
    const sector = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    sector.setAttribute('d', wedgePath(50, 50, 45, -90 + i * 45, -90 + (i + 1) * 45));
    sector.setAttribute('fill', shaded.includes(i) ? '#b9c7e9' : '#fff');
    sector.setAttribute('stroke', '#52617a');
    sector.setAttribute('stroke-width', '1.2');
    svg.appendChild(sector);
  }
  const outline = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  outline.setAttribute('cx', '50');
  outline.setAttribute('cy', '50');
  outline.setAttribute('r', '45');
  outline.setAttribute('fill', 'none');
  outline.setAttribute('stroke', '#52617a');
  outline.setAttribute('stroke-width', '1.2');
  svg.appendChild(outline);
  choice.appendChild(svg);
  pieOptions.appendChild(choice);
});

const scoreEndpoint = 'https://script.google.com/macros/s/AKfycbwoKOIqTMIMco2oYwbJEg6IIYW_9KmOEcyxY9NOrAcF3YHLeSeh9Mb7oEQN74rQlzinvw/exec';
const answerKey = [
  { type: 'choice', answers: ['B'] },
  { type: 'checks', answers: [0, 1, 2] },
  { type: 'truth', answers: ['Benar', 'Benar', 'Salah', 'Benar'] },
  { type: 'choice', answers: ['B'] },
  { type: 'choice', answers: ['B'] },
  { type: 'choice', answers: ['A'] },
  { type: 'checks', answers: [0, 2, 3] },
  { type: 'truth', answers: ['Salah', 'Salah', 'Benar', 'Benar'] },
  { type: 'checks', answers: [0, 1, 2] },
  { type: 'truth', answers: ['Benar', 'Benar', 'Benar', 'Salah'] },
  { type: 'choice', answers: ['A', 'B'] },
  { type: 'choice', answers: ['C'] },
  { type: 'checks', answers: [0, 2] },
  { type: 'choice', answers: ['D'] },
  { type: 'choice', answers: ['C'] },
  { type: 'checks', answers: [0, 1, 2] },
  { type: 'truth', answers: ['Benar', 'Salah', 'Benar', 'Benar'] },
  { type: 'choice', answers: ['A'] },
  { type: 'choice', answers: ['C'] },
  { type: 'checks', answers: [0] },
  { type: 'checks', answers: [0, 2] },
  { type: 'choice', answers: ['C'] },
  { type: 'choice', answers: ['D'] },
  { type: 'checks', answers: [3] },
  { type: 'truth', answers: ['Salah', 'Salah', 'Salah', 'Benar'] },
  { type: 'choice', answers: ['A'] },
  { type: 'choice', answers: ['C'] },
  { type: 'choice', answers: ['C'] },
  { type: 'choice', answers: ['C'] },
  { type: 'truth', answers: ['Salah', 'Benar', 'Salah', 'Benar'] }
];

const scoreMessage = document.getElementById('scoreMessage');
const topScore = document.getElementById('topScore');
const submitButton = document.getElementById('submitScore');
const dateInput = document.getElementById('studentDate');
const today = new Date();
const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
dateInput.value = localDate;

function isQuestionCorrect(question, key) {
  if (key.type === 'checks') {
    const selected = [...question.querySelectorAll('input[type="checkbox"]')]
      .map((input, index) => input.checked ? index : -1)
      .filter(index => index !== -1);
    return selected.length === key.answers.length && key.answers.every(index => selected.includes(index));
  }

  const radios = [...question.querySelectorAll('input[type="radio"]')];
  if (key.type === 'truth') {
    const groups = [...new Set(radios.map(radio => radio.name))];
    if (groups.length !== key.answers.length) return false;
    return groups.every((name, index) => {
      const selected = radios.find(radio => radio.name === name && radio.checked);
      return selected?.getAttribute('aria-label') === key.answers[index];
    });
  }

  const selected = radios.find(radio => radio.checked);
  if (!selected) return false;
  const label = selected.closest('label')?.textContent.trim() || '';
  const letter = label.match(/^([A-D])\./)?.[1];
  return key.answers.includes(letter);
}

submitButton.addEventListener('click', async () => {
  const student = {
    nama: document.getElementById('studentName').value.trim(),
    kelas: document.getElementById('studentClass').value.trim(),
    tanggal: dateInput.value,
    absen: document.getElementById('studentNumber').value.trim()
  };
  const missing = Object.values(student).some(value => !value);
  if (missing) {
    scoreMessage.textContent = 'Lengkapi nama, kelas, tanggal, dan nomor absen terlebih dahulu.';
    document.getElementById('studentName').focus();
    return;
  }

  const questions = [...document.querySelectorAll('.question')];
  if (questions.length !== answerKey.length) {
    scoreMessage.textContent = 'Jumlah soal tidak sesuai; nilai belum dikirim.';
    return;
  }

  const benar = questions.reduce((total, question, index) => total + Number(isQuestionCorrect(question, answerKey[index])), 0);
  const nilai = Math.round((benar / answerKey.length) * 100);
  topScore.textContent = nilai;
  scoreMessage.textContent = `Nilai: ${nilai} — ${benar} dari ${answerKey.length} soal benar. Mengirim nilai ke spreadsheet…`;
  submitButton.disabled = true;

  try {
    await fetch(scoreEndpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ ...student, benar, jumlahSoal: answerKey.length, nilai })
    });
    scoreMessage.textContent = `Nilai: ${nilai} — ${benar} dari ${answerKey.length} soal benar. Permintaan penyimpanan telah dikirim; periksa sheet “Nilai” untuk memastikan data masuk.`;
  } catch (error) {
    scoreMessage.textContent = `Nilai: ${nilai} — ${benar} dari ${answerKey.length} soal benar. Pengiriman gagal; periksa koneksi dan izin Web App, lalu coba lagi.`;
  } finally {
    submitButton.disabled = false;
  }
});
