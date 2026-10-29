import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chordNotes, melodyNotes, midi, renderSong, SONGS, songSeconds } from '../src/audio/music.ts';

test('las notas y los acordes se leen bien', () => {
  assert.equal(midi('A4'), 69);
  assert.equal(midi('C#5'), 73);
  assert.equal(midi('Bb3'), 58);
  assert.throws(() => midi('H2'));
  assert.deepEqual(chordNotes('A:m'), [57, 60, 64]);
  assert.deepEqual(chordNotes('E:7'), [52, 56, 59, 62]);
  assert.deepEqual(chordNotes('F'), [53, 57, 60]);
});

test('cada canción está bien escrita: 16 pasos por compás, un acorde por compás, batería de un compás', () => {
  for (const s of Object.values(SONGS)) {
    assert.equal(s.melody.length, s.chords.length, s.id);
    assert.equal(s.drums.length, 16, `${s.id}: batería`);
    if (s.fill) assert.equal(s.fill.length, 16, `${s.id}: redoble`);
    assert.ok(melodyNotes(s).length >= s.chords.length * 2, `${s.id}: melodía con chicha`);
    for (const c of s.chords) chordNotes(c);
  }
  assert.ok(SONGS.jefa!.bpm > SONGS.planta!.bpm, 'la de la jefa va más deprisa');
});

test('una vuelta de canción dura lo que debe, suena, no satura y siempre sale igual', () => {
  for (const s of Object.values(SONGS)) {
    const sr = 8000;
    const a = renderSong(s, sr);
    assert.equal(a.length, Math.round(songSeconds(s) * sr));
    let peak = 0;
    let sq = 0;
    for (const x of a) {
      peak = Math.max(peak, Math.abs(x));
      sq += x * x;
    }
    assert.ok(peak <= 0.951, `${s.id} satura (${peak})`);
    assert.ok(Math.sqrt(sq / a.length) > 0.05, `${s.id} casi no suena`);
    // The loop joins: the first and last samples are close (what rings past the end wraps to the start).
    assert.ok(Math.abs(a[0]! - a[a.length - 1]!) < 0.6);
    assert.deepEqual(renderSong(s, sr).slice(0, 2000), a.slice(0, 2000));
  }
});
