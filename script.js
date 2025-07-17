const VF = Vex.Flow;

// Set up renderer and context using VexFlow
const renderer = new VF.Renderer(document.getElementById("musicContainer"), VF.Renderer.Backends.SVG);
const ctx = renderer.getContext();

// Resize canvas (you can adjust width/height as needed)
renderer.resize(3000, 5000);

let notes = [];

const durationMap = {
  "16": {vfDuration: "16", beats: 0.25},
  "8":  {vfDuration: "8",  beats: 0.5},
  "4":  {vfDuration: "q",  beats: 1},
  "2":  {vfDuration: "h",  beats: 2},
  "1":  {vfDuration: "w",  beats: 4},

  "16r": {vfDuration: "16r", beats: 0.25},
  "8r":  {vfDuration: "8r",  beats: 0.5},
  "4r":  {vfDuration: "qr",  beats: 1},
  "2r":  {vfDuration: "hr",  beats: 2},
  "1r":  {vfDuration: "wr",  beats: 4},
};

function groupNotesIntoMeasures(notes, beatsPerMeasure = 4) {
  const measures = [];
  let currentMeasure = [];
  let currentBeats = 0;

  for (let note of notes) {
    const beatVal = durationMap[note.duration]?.beats;
    if (beatVal == null) continue;

    if (currentBeats + beatVal > beatsPerMeasure) {
      measures.push(currentMeasure);
      currentMeasure = [];
      currentBeats = 0;
    }

    currentMeasure.push(note);
    currentBeats += beatVal;
  }

  measures.push(currentMeasure);  

  return measures;
}

function render() {
  // Clear container
  const container = document.getElementById("musicContainer");
  container.innerHTML = "";

  // Create a new renderer and context tied to fresh SVG container
  const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);

  // Calculate needed height based on measures
  const measures = groupNotesIntoMeasures(notes);
  const staveWidth = 400;
  const startX = 10;
  const startY = 40;
  const verticalSpacing = 120;
  const firstLonger = 30;
  const measuresPerRow = 3;
  const totalRows = Math.ceil(measures.length / measuresPerRow);
  const totalHeight = startY + totalRows * verticalSpacing;

  // Resize to fit
  renderer.resize(1300, totalHeight);

  const ctx = renderer.getContext();

  // Render measures as before
  measures.forEach((measureNotes, i) => {
    const row = Math.floor(i / measuresPerRow);
    const col = i % measuresPerRow;

    const x = startX + col * staveWidth + (col === 0 ? 0 : firstLonger);
    const y = startY + row * verticalSpacing;
    const width = staveWidth + (col === 0 ? firstLonger : 0);

    const stave = new VF.Stave(x, y, width);
    if (col === 0) stave.addClef("treble").addTimeSignature("4/4");

    stave.setContext(ctx).draw();

    const vfNotes = measureNotes.map(n => {
      const dur = durationMap[n.duration].vfDuration;
      const isRest = dur.endsWith("r");

      const note = new VF.StaveNote({
        clef: "treble",
        keys: isRest ? ["b/4"] : [n.key.toLowerCase()],
        duration: dur
      });

      if (!isRest) {
        if (n.key.includes("#")) note.addAccidental(0, new VF.Accidental("#"));
        else if (n.key.includes("b")) note.addAccidental(0, new VF.Accidental("b"));
      }

      return note;
    });

    const voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
    voice.setStrict(false);
    voice.addTickables(vfNotes);

    new VF.Formatter().joinVoices([voice]).format([voice], width - 65);
    voice.draw(ctx, stave);
  });
}


function addNote() {
  const pitch = document.getElementById("note-select").value;
  const duration = document.getElementById("duration-select").value;

  notes.push({ key: pitch, duration });
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
  // reset select if you want, e.g. e.target.selectedIndex = 0;
}
async function downloadPDF() {

}
function downloadPNG() {
  const container = document.getElementById("musicContainer");
  const svg = container.querySelector("svg");

  if (!svg) {
    alert("No SVG found to export!");
    return;
  }

  const svgData = new XMLSerializer().serializeToString(svg);

  // Create a canvas matching the SVG size
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

    // Trigger PNG download
    const pngData = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = pngData;
    a.download = "music.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  img.onerror = () => {
    alert("Failed to load SVG image for conversion.");
    URL.revokeObjectURL(url);
  };

  img.src = url;
}

async function downloadSVG(){
  const container = document.getElementById("musicContainer");
  const svg = container.querySelector("svg");

  if (!svg) {
    alert("No SVG to download!");
    return;
  }

  // Serialize SVG XML to string
  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svg);

  // Create a Blob with SVG MIME type
  const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });

  // Create a temporary download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "music.svg";
  document.body.appendChild(a);
  a.click();

  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function downloadMIDI(){

}

render();
