export class NoteDeviceConflict extends Error {
  constructor() { super("L'appunto è stato cambiato in un'altra scheda."); }
}
