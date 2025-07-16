const VF = Vex.Flow;

// Set up renderer and context using VexFlow
const renderer = new VF.Renderer(document.getElementById("musicCanvas"), VF.Renderer.Backends.CANVAS);
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
  ctx.clear();

  const staveWidth = 100;
  const startX = 10;
  const startY = 40;
  const verticalSpacing = 100;
  const firstLonger = 30;

  const canvasWidth = 1500;
  const measuresPerRow = Math.floor(canvasWidth / staveWidth);

  const measures = groupNotesIntoMeasures(notes);

  measures.forEach((measureNotes, i) => {
    const row = Math.floor(i / measuresPerRow);
    const col = i % measuresPerRow;

    let stave, x;
    const y = startY + row * verticalSpacing;
    if (col == 0){
        x = startX;
        stave = new VF.Stave(x, y, staveWidth + firstLonger);
        stave.addClef("treble").addTimeSignature("4/4");
    }
    else{
        x = startX + col * staveWidth + firstLonger;
        stave = new VF.Stave(x,y, staveWidth);
    }
    
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
        if (n.key.includes("#")) {
          note.addAccidental(0, new VF.Accidental("#"));
        } else if (n.key.includes("b")) {
          note.addAccidental(0, new VF.Accidental("b"));
        }
      }

      return note;
    });

    const voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
    voice.setStrict(false);
    voice.addTickables(vfNotes);

    new VF.Formatter().joinVoices([voice]).format([voice], staveWidth);
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

render();
