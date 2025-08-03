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

const validAccidentals = [
  "",
  "#",
  "b",
  "n",
  "##",
  "bb"
]

const validNotes = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G"
]

const accidentalsMap = {
  "none": null,
  "sharp": "#",
  "flat": "b",
  "natural": "n",
  "double-sharp": "##",
  "double-flat": "bb"
};

function showEditor() {
  document.getElementById("Editor_part").style.display = "block";
  document.getElementById("Tutorial_part").style.display = "none";
}

function showTutorial() {
  document.getElementById("Editor_part").style.display = "none";
  document.getElementById("Tutorial_part").style.display = "block";
}

function groupNotesIntoMeasures(notes, beatsPerMeasure = 4) {
  // no need to change to staveNotes
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

function calculateMeasureWidths(measures){
  const rowLength = 1250;
  const oneNoteWidth = 52;
  let widths = [];
  let currentLength = 0;
  for (let i = 0; i < measures.length; i++){
    let width = measures[i].length * oneNoteWidth;
    let nextWidth = rowLength;
    if (i < measures.length - 1){
      nextWidth = measures[i+1].length * oneNoteWidth;
    }
    if (currentLength + width + nextWidth >= rowLength){
      width = rowLength - currentLength;
      currentLength = 0;
    }
    else{
      currentLength += width;
    }
    widths.push(width);
  }

  return widths;
}

function numOfRows(widths){
  let sum = 0;
  rowLength = 1250;
  for (let i = 0; i < widths.length; i++){
    sum += widths[i];
  }
  return sum / rowLength;
}

function areFirst(widths){
  let areFirst = [];
  rowLength = 1250;
  currentWidth = 0;
  for (let i = 0; i < widths.length; i++){
    if (currentWidth === 0){
      areFirst.push(1);
    }
    else{
      areFirst.push(0);
    }
    currentWidth += widths[i];
    if (currentWidth >= rowLength){
      currentWidth = 0;
    }
  }

  return areFirst;
}

function render() {
  // no need to change (?)
  const container = document.getElementById("musicContainer");
  container.innerHTML = "";

  const renderer = new Renderer(container, Renderer.Backends.SVG);
  const rowLength = 1250;
  const startX = 10;
  const startY = 40;
  const verticalSpacing = 120;
  const firstLonger = 65;

  const measures = groupNotesIntoMeasures(notes);
  const measureWidths = calculateMeasureWidths(measures);
  const isFirst = areFirst(measureWidths)

  const totalRows = numOfRows(measureWidths);              
  const totalHeight = startY + totalRows * verticalSpacing;

  renderer.resize(1365, totalHeight);
  const ctx = renderer.getContext();


  let currentRow = -1;
  let lastX = startX;
  for (let i = 0; i < measures.length; i++){
    let measureNotes = measures[i];
    let baseStaveWidth = measureWidths[i];
    let currentStaveWidth = baseStaveWidth;
    if (isFirst[i]){
      lastX = startX;
      currentRow++;
      currentStaveWidth += firstLonger;
    }
    const x = lastX;
    const y = startY + currentRow * verticalSpacing;

    const stave = new Stave(x, y, currentStaveWidth);
    if (isFirst[i]) stave.addClef("treble").addTimeSignature("4/4");

    stave.setContext(ctx).draw();

    const voice = new Voice({ num_beats: 4, beat_value: 4 });
    voice.setStrict(false);
    voice.addTickables(measureNotes);

    new Formatter().joinVoices([voice]).format([voice], baseStaveWidth - 20);
    voice.draw(ctx, stave);

    lastX += currentStaveWidth;
  };
}

function addNote() {
  const pitch = document.getElementById("note-select").value;
  const octave = document.getElementById("octave-select")?.value || "4";
  const fullPitch = pitch.toLowerCase() + "/" + octave;
  const durationKey = document.getElementById("duration-select").value;
  const accidental = document.getElementById("accidentals-select")?.value || "none";

  const isRest = (pitch === "rest");
  let dur = durationMap[durationKey].vfDuration;
  if (isRest) dur += "r";
  

  const note = new StaveNote({
    clef: "treble",
    keys: isRest ? ["b/4"] : [fullPitch],
    duration: dur,
  });

  if (!isRest && accidentalsMap[accidental]) {
    note.addModifier(new Accidental(accidentalsMap[accidental]), 0);
    note._myAccidentals = [accidentalsMap[accidental]];
  }
  else{
    note._myAccidental = [null];
  }

  notes.push(note);
  render();
}

function deleteLastNote() {
  if (notes.length === 0) return;
  notes.pop();
  render();
}

function addNoteFromInput() {
  const keyboardInput = document.getElementById("keyboard-select").value;
  let chord = [];
  let durationKey = 4;
  chord = keyboardInput.split(" ");
  if (Number.isInteger(Number(chord[chord.length - 1]))) {
    durationKey = chord[chord.length - 1];
  }
  const dur = durationMap[durationKey].vfDuration;

  if (chord[0] === "rest"){
    if (chord.length > 2){
      alert("Invalid note format. Use format like 'Bb/3 A c#/5' or 'rest 2'");
    }
    else if (chord.length === 2 && !Number.isInteger(Number(chord[chord.length - 1]))){
      alert("Invalid note format. Use format like 'Bb/3 a/4 c#/5' or 'rest 2'");
    }
    let parsedChord = new StaveNote({
      clef: "treble",
      duration: dur + "r",
      keys: ["b/4"]
    })
    notes.push(parsedChord);
    render();
    return;
  }

  let allKeys = [];
  let allAccidentals = []
  for (let i = 0; i < chord.length; i++){
    if (i === chord.length - 1 && Number.isInteger(Number(chord[chord.length - 1]))){
      continue;
    }
    const [notePart, octavePart] = chord[i].split("/");
    if (!validNotes.includes(notePart[0].toUpperCase())){
      alert("Invalid note format. Use format like 'C#/4' or 'Bb/3 a/4 c#/5'");
    }
    let parsedNote = notePart[0].toLowerCase() + "/" + (octavePart || 4);
    allKeys.push(parsedNote);
    let accidentalPart = notePart.slice(1);
    if (!validAccidentals.includes(accidentalPart)){
      alert("Invalid note format. Use format like 'C#/4' or 'Bb/3 a/4 c#/5'");
    }
    allAccidentals.push(accidentalPart);
  }
  let parsedChord = new StaveNote({
    clef: "treble",
    duration: dur,
    keys: allKeys
  })
  for (let i = 0; i < allAccidentals.length; i++){
    if (allAccidentals[i]){
      parsedChord.addModifier(new Accidental(allAccidentals[i]), i);
    }
  }
  parsedChord._myAccidentals = allAccidentals;

  notes.push(parsedChord);
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

function playSound() {
    const synth = new Tone.PolySynth().toDestination();
    const now = Tone.now();
    let time = now;
    notes.forEach((note) => {
      // Skip rests
      if (note.isRest()) {
          const durKey = Object.keys(durationMap).find(k => durationMap[k].vfDuration === note.duration);
          const beats = durationMap[durKey]?.beats || 0.5;
          time += beats * 0.5;
          return;
      }
      let pitches = [];
      for (let i = 0; i < note.keys.length; i++){
        const key = note.keys[i];
        let [noteNameRaw, octave] = key.split("/");
        let accidental = note._myAccidentals[i];

        const acc = note.modifiers?.find(mod =>
          mod.getCategory?.() === "accidentals" || mod.type === "Accidental"
        );
        if (acc) {
          if (typeof acc.getValue === "function") {
            accidental = acc.getValue();
          } else if (acc.value) {
            accidental = acc.value;
          }
        }

        let toneNote = noteNameRaw.toUpperCase();
        if (accidental === "#") toneNote += "#";
        else if (accidental === "b") toneNote += "b";
        else if (accidental === "##") toneNote += "##";
        else if (accidental === "bb") toneNote += "bb";
        // "n" (natural) is default

        pitches.push( toneNote + (octave || "4") );

      }

      const durKey = Object.keys(durationMap).find(k => durationMap[k].vfDuration === note.duration);
      const beats = durationMap[durKey]?.beats || 0.5;
      const seconds = beats * 0.5;
      synth.triggerAttackRelease(pitches, seconds, time);
      time += seconds;
    });
}

document.addEventListener("keydown", function (e) {
    const active = document.activeElement;
    if (
        e.key === "Backspace" &&
        (!active || active.id !== "keyboard-select")
    ) {
        e.preventDefault();
        deleteLastNote();
    }
});

// Initial render
render();
