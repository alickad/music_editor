import * as Tone from "tone";
window.Tone = Tone;

import {
  Renderer,
  Stave,
  StaveNote,
  Voice,
  Formatter,
  Accidental
} from "vexflow";

window.Vex = { Flow: { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } };

import './script.js';