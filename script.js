const VF = Vex.Flow;
const canvas = document.getElementById("musicCanvas");
const ctx = canvas.getContext("2d");

let notes = [{
    key: "f/4",
    duration: "q"
  }];

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const renderer = new VF.Renderer(canvas, VF.Renderer.Backends.CANVAS);
  renderer.resize(600, 200);
  const context = renderer.getContext();

  const stave = new VF.Stave(10, 40, 580);
  stave.addClef("treble").addTimeSignature("4/4");
  stave.setContext(context).draw();

  if (notes.length > 0) {
    const vfNotes = notes.map(n => {
      const note = new VF.StaveNote({
        clef: "treble",
        keys: [n.key],
        duration: n.duration
      });

      // Add accidental if present
      const accidental = n.key.includes("#") ? "#" : n.key.includes("b") ? "b" : null;
      if (accidental) {
        note.addAccidental(0, new VF.Accidental(accidental));
      }

      return note;
    });

    VF.Formatter.FormatAndDraw(context, stave, vfNotes);
  }
}

function addNote() {
  const pitch = document.getElementById("note-select").value; // e.g., "c/4"
  const duration = document.getElementById("duration-select").value; // e.g., "q"

  notes.push({
    key: pitch,
    duration: duration
  });

  render();
}

function clearNotes() {
  notes = [];
  render();
}

render(); // initial render