const {
  Renderer,
  Stave,
  StaveNote,
  Voice,
  Formatter,
  Accidental
} = Vex.Flow;

let notes = [];

const durationMap = {
  "16": { vfDuration: "16", beats: 0.25 },
  "8":  { vfDuration: "8",  beats: 0.5 },
  "4":  { vfDuration: "q",  beats: 1 },
  "2":  { vfDuration: "h",  beats: 2 },
  "1":  { vfDuration: "w",  beats: 4 },
  "16r": { vfDuration: "16r", beats: 0.25 },
  "8r":  { vfDuration: "8r",  beats: 0.5 },
  "4r":  { vfDuration: "qr",  beats: 1 },
  "2r":  { vfDuration: "hr",  beats: 2 },
  "1r":  { vfDuration: "wr",  beats: 4 },
};

const accidentalsMap = {
  "none": null,
  "sharp": "#",
  "flat": "b",
  "natural": "n",
  "double-sharp": "##",
  "double-flat": "bb"
};

function groupNotesIntoMeasures(notes, beatsPerMeasure = 4) {
  const measures = [];
  let current = [];
  let currentBeats = 0;

  for (let note of notes) {
    const durKey = Object.keys(durationMap).find(k => durationMap[k].vfDuration === note.duration);
    const beatVal = durationMap[durKey]?.beats || 0;

    if (currentBeats + beatVal > beatsPerMeasure) {
      measures.push(current);
      current = [];
      currentBeats = 0;
    }

    current.push(note);
    currentBeats += beatVal;
  }

  if (current.length > 0) {
    measures.push(current);
  }

  return measures;
}

function render() {
  const container = document.getElementById("musicContainer");
  container.innerHTML = "";

  const renderer = new Renderer(container, Renderer.Backends.SVG);
  const staveWidth = 400;
  const startX = 10;
  const startY = 40;
  const verticalSpacing = 120;
  const firstLonger = 30;
  const measuresPerRow = 3;

  const measures = groupNotesIntoMeasures(notes);
  const totalRows = Math.ceil(measures.length / measuresPerRow);
  const totalHeight = startY + totalRows * verticalSpacing;

  renderer.resize(1300, totalHeight);
  const ctx = renderer.getContext();

  measures.forEach((measureNotes, i) => {
    const row = Math.floor(i / measuresPerRow);
    const col = i % measuresPerRow;

    const x = startX + col * staveWidth + (col === 0 ? 0 : firstLonger);
    const y = startY + row * verticalSpacing;
    const width = staveWidth + (col === 0 ? firstLonger : 0);

    const stave = new Stave(x, y, width);
    if (col === 0) stave.addClef("treble").addTimeSignature("4/4");

    stave.setContext(ctx).draw();

    const voice = new Voice({ num_beats: 4, beat_value: 4 });
    voice.setStrict(false);
    voice.addTickables(measureNotes);

    new Formatter().joinVoices([voice]).format([voice], width - 65);
    voice.draw(ctx, stave);
  });
}

function addNote() {
  const pitch = document.getElementById("note-select").value;
  const octave = document.getElementById("octave-select")?.value || "4";
  const fullPitch = pitch.toLowerCase() + "/" + octave;
  const durationKey = document.getElementById("duration-select").value;
  const accidental = document.getElementById("accidentals-select")?.value || "none";

  const dur = durationMap[durationKey].vfDuration;
  const isRest = dur.endsWith("r");

  const note = new StaveNote({
    clef: "treble",
    keys: isRest ? ["b/4"] : [fullPitch],
    duration: dur,
  });

  if (!isRest && accidentalsMap[accidental]) {
    note.addModifier(new Accidental(accidentalsMap[accidental]), 0);
  }

  notes.push(note);
  render();
}

function clearNotes() {
  notes = [];
  render();
}

function handleDownloadChange(e) {
  const val = e.target.value;
  if (val === "png") downloadPNG();
  else if (val === "pdf") downloadPDF();
  else if (val === "svg") downloadSVG();
  else if (val === "midi") downloadMIDI();
}

function downloadPNG() {
  const container = document.getElementById("musicContainer");
  const svg = container.querySelector("svg");
  if (!svg) return alert("No SVG to download!");

  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement("canvas");
  const rect = svg.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  const ctx = canvas.getContext("2d");

  const img = new Image();
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "music.png";
    a.click();
  };

  img.onerror = () => {
    alert("Failed to load SVG image.");
    URL.revokeObjectURL(url);
  };

  img.src = url;
}

function downloadSVG() {
  const container = document.getElementById("musicContainer");
  const svg = container.querySelector("svg");
  if (!svg) return alert("No SVG to download!");

  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svg);
  const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "music.svg";
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPDF() {
  alert("PDF export is not implemented yet.");
}

function downloadMIDI() {
  alert("MIDI export is not implemented yet.");
}

// Initial render
render();
