import test from "node:test";
import assert from "node:assert/strict";
import { DELETE_WORDS, isDeleteWord } from "../lib/account-confirmation";
import { locales } from "../lib/i18n/locale";

test("every interface language has a deletion word", () => {
  assert.deepEqual(Object.keys(DELETE_WORDS).sort(), [...locales].sort());
  for (const word of Object.values(DELETE_WORDS)) assert.ok(word.length > 0 && word.length <= 32, word);
});

test("the word of any language is accepted, whatever the case and outer spaces", () => {
  for (const word of ["ELIMINA", "löschen", " Supprimer ", "delete"]) assert.equal(isDeleteWord(word), true, word);
});

test("anything else is refused, including a technical handle or an empty value", () => {
  for (const value of ["", " ", "ELIMINAR", "DEL", "u_abcdefghijklmnopqrstuvwxyz", "ELIMINA ORA"])
    assert.equal(isDeleteWord(value), false, value);
});
