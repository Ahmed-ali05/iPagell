"use client";

import {
  Clipboard,
  Crown,
  DoorOpen,
  Link2,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserMinus,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ClassEventsPanel } from "@/components/class-events-panel";
import type { SchoolData } from "@/types/domain";
import type { ClassAgendaController } from "@/hooks/use-class-agenda";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import type {
  ClassDetail,
  ClassInvite,
  ClassSummary,
  CreatedClassInvite,
} from "@/types/classes";

type ConfirmAction = {
  title: string;
  description: string;
  label: string;
  run: () => Promise<void>;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "same-origin",
    cache: "no-store",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw new Error(data.error ?? "Operazione non riuscita. Riprova.");
  return data;
}

const roleLabel = {
  owner: "Proprietario",
  moderator: "Moderatore",
  member: "Membro",
} as const;

const dateLabel = (value: number) =>
  new Intl.DateTimeFormat("it-CH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export function ClassesView({
  currentUserId,
  defaultDisplayName,
  data,
  semesterId,
  agenda,
}: {
  currentUserId: string;
  defaultDisplayName: string;
  data: SchoolData;
  semesterId: string;
  agenda: ClassAgendaController;
}) {
  const detailSequence = useRef(0);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ClassDetail | null>(null);
  const [invites, setInvites] = useState<ClassInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [createdInvite, setCreatedInvite] =
    useState<CreatedClassInvite | null>(null);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [checkedAt, setCheckedAt] = useState(0);

  const canManageInvites =
    detail?.role === "owner" || detail?.role === "moderator";

  const loadDetail = useCallback(async (id: string) => {
    const ticket = ++detailSequence.current;
    const result = await request<{ class: ClassDetail }>(`/api/classes/${id}`);
    if (ticket !== detailSequence.current) return;
    setDetail(result.class);
    setInvites([]);
    if (result.class.role === "owner" || result.class.role === "moderator") {
      const inviteResult = await request<{ invites: ClassInvite[] }>(
        `/api/classes/${id}/invites`,
      );
      if (ticket !== detailSequence.current) return;
      setCheckedAt(Date.now());
      setInvites(inviteResult.invites);
    } else setInvites([]);
  }, []);

  const loadClasses = useCallback(
    async (preferredId?: string) => {
      setError("");
      const result = await request<{ classes: ClassSummary[] }>("/api/classes");
      setClasses(result.classes);
      const nextId =
        preferredId && result.classes.some((item) => item.id === preferredId)
          ? preferredId
          : (result.classes[0]?.id ?? null);
      setSelectedId(nextId);
      if (nextId) await loadDetail(nextId);
      else {
        setDetail(null);
        setInvites([]);
      }
    },
    [loadDetail],
  );

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const code = hash.get("join");
    if (code) {
      queueMicrotask(() => {
        setJoinCode(code);
        setJoinOpen(true);
        history.replaceState(null, "", `${location.pathname}?view=classes`);
      });
    }
    queueMicrotask(() => {
      setCheckedAt(Date.now());
      void loadClasses()
        .catch((cause) =>
          setError(
            cause instanceof Error ? cause.message : "Classi non disponibili",
          ),
        )
        .finally(() => setLoading(false));
    });
  }, [loadClasses]);

  async function selectClass(id: string) {
    if (id === selectedId) return;
    setSelectedId(id);
    setDetail(null);
    setError("");
    try {
      await loadDetail(id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Classe non disponibile");
    }
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const fields = Object.fromEntries(new FormData(event.currentTarget));
      const result = await request<{ class: ClassDetail }>("/api/classes", {
        method: "POST",
        body: JSON.stringify(fields),
      });
      setCreateOpen(false);
      await loadClasses(result.class.id);
      toast.success("Classe creata");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Classe non creata");
    } finally {
      setBusy(false);
    }
  }

  async function submitJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const fields = Object.fromEntries(new FormData(event.currentTarget));
      const result = await request<{ class: ClassDetail }>("/api/classes/join", {
        method: "POST",
        body: JSON.stringify(fields),
      });
      setJoinOpen(false);
      setJoinCode("");
      await loadClasses(result.class.id);
      toast.success(`Sei entrato in ${result.class.name}`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Ingresso non riuscito");
    } finally {
      setBusy(false);
    }
  }

  async function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    setBusy(true);
    try {
      const fields = new FormData(event.currentTarget);
      const result = await request<{ invite: CreatedClassInvite }>(
        `/api/classes/${detail.id}/invites`,
        {
          method: "POST",
          body: JSON.stringify({
            expiresInDays: Number(fields.get("expiresInDays")),
            maxUses: Number(fields.get("maxUses")),
          }),
        },
      );
      setCreatedInvite(result.invite);
      setInvites((current) => [result.invite, ...current]);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Invito non creato");
    } finally {
      setBusy(false);
    }
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    setBusy(true);
    try {
      const fields = Object.fromEntries(new FormData(event.currentTarget));
      const result = await request<{ class: ClassDetail }>(
        `/api/classes/${detail.id}`,
        { method: "PATCH", body: JSON.stringify(fields) },
      );
      setDetail(result.class);
      setEditOpen(false);
      await loadClasses(detail.id);
      toast.success("Classe aggiornata");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Modifica non salvata");
    } finally {
      setBusy(false);
    }
  }

  async function submitDisplayName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    setBusy(true);
    try {
      const displayName = String(new FormData(event.currentTarget).get("displayName"));
      const result = await request<{ class: ClassDetail }>(
        `/api/classes/${detail.id}/members/${currentUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ operation: "display-name", displayName }),
        },
      );
      setDetail(result.class);
      setNameOpen(false);
      await loadClasses(detail.id);
      toast.success("Nome aggiornato");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Modifica non salvata");
    } finally {
      setBusy(false);
    }
  }

  async function updateMember(
    userId: string,
    input: { operation: "role"; role: "moderator" | "member" } | { operation: "transfer" },
  ) {
    if (!detail) return;
    setBusy(true);
    try {
      const result = await request<{ class: ClassDetail }>(
        `/api/classes/${detail.id}/members/${userId}`,
        { method: "PATCH", body: JSON.stringify(input) },
      );
      setDetail(result.class);
      await loadClasses(detail.id);
      toast.success(input.operation === "transfer" ? "Proprietà trasferita" : "Ruolo aggiornato");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Modifica non riuscita");
    } finally {
      setBusy(false);
    }
  }

  const activeInvites = useMemo(
    () =>
      invites.filter(
        (invite) =>
          !invite.revokedAt &&
          invite.uses < invite.maxUses &&
          (!invite.expiresAt || invite.expiresAt > checkedAt),
      ),
    [checkedAt, invites],
  );

  const inviteLink = createdInvite
    ? `https://ipagell.website/app?view=classes#join=${createdInvite.code}`
    : "";

  if (loading)
    return (
      <section className="panel classes-loading" aria-live="polite">
        <RefreshCw /> <span>Caricamento classi…</span>
      </section>
    );

  return (
    <>
      <div className="classes-toolbar">
        <div>
          <span className="eyebrow">Le tue classi</span>
        </div>
        <div>
          <button className="soft-button" onClick={() => setJoinOpen(true)}>
            <DoorOpen /> Inserisci codice
          </button>
          <button className="primary-button" onClick={() => setCreateOpen(true)}>
            <Plus /> Nuova classe
          </button>
        </div>
      </div>

      {error && (
        <section className="sync-banner" role="alert">
          <p>{error}</p>
          <button className="soft-button" onClick={() => void loadClasses().catch(cause => setError(cause instanceof Error ? cause.message : "Classi non disponibili"))}>
            Riprova
          </button>
        </section>
      )}

      {!classes.length ? (
        <section className="panel class-empty">
          <UsersRound />
          <h2>La tua prima classe</h2>
          <p>
            Creane una e condividi l’invito, oppure inserisci il codice ricevuto
            da un compagno.
          </p>
          <div>
            <button className="primary-button" onClick={() => setCreateOpen(true)}>
              Crea una classe
            </button>
            <button className="soft-button" onClick={() => setJoinOpen(true)}>
              Ho un codice
            </button>
          </div>
        </section>
      ) : (
        <div className="classes-layout">
          <aside className="panel class-switcher" aria-label="Le tue classi">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Le tue classi</span>
                <h3>{classes.length}</h3>
              </div>
            </div>
            <div className="class-switcher-list">
              {classes.map((item) => (
                <button
                  key={item.id}
                  className={item.id === selectedId ? "active" : ""}
                  onClick={() => void selectClass(item.id)}
                >
                  <span>{item.name.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <b>{item.name}</b>
                    <small>
                      {item.memberCount} {item.memberCount === 1 ? "membro" : "membri"}
                    </small>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <div className="class-detail-stack">
            {!detail ? (
              <section className="panel classes-loading">Caricamento…</section>
            ) : (
              <>
                <section className="class-hero">
                  <div>
                    <span className="class-role">{roleLabel[detail.role]}</span>
                    <h2>{detail.name}</h2>
                    <p>{detail.description || "Nessuna descrizione."}</p>
                  </div>
                  <div className="class-hero-actions">
                    {canManageInvites && (
                      <button
                        className="primary-button"
                        onClick={() => {
                          setCreatedInvite(null);
                          setInviteOpen(true);
                        }}
                      >
                        <Link2 /> Crea invito
                      </button>
                    )}
                    {detail.role === "owner" && (
                      <button className="soft-button" onClick={() => setEditOpen(true)}>
                        <Pencil /> Modifica
                      </button>
                    )}
                  </div>
                </section>

                <ClassEventsPanel key={detail.id} detail={detail} userId={currentUserId} data={data} semesterId={semesterId} controller={agenda} />

                <details className="class-administration">
                  <summary>Membri e gestione della classe <span>{detail.memberCount} {detail.memberCount === 1 ? "membro" : "membri"}</span></summary>
                  <div className="class-detail-stack">
                <section className="panel members-panel">
                  <div className="panel-title">
                    <div>
                      <span className="eyebrow">Persone</span>
                      <h3>{detail.memberCount} membri</h3>
                    </div>
                    <button onClick={() => setNameOpen(true)}>Il mio nome</button>
                  </div>
                  <div className="member-list">
                    {detail.members.map((member) => {
                      const canRemove =
                        !member.isCurrentUser &&
                        member.role !== "owner" &&
                        (detail.role === "owner" ||
                          (detail.role === "moderator" && member.role === "member"));
                      return (
                        <article key={member.userId}>
                          <span className={`member-avatar ${member.role}`}>
                            {member.displayName.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <b>
                              {member.displayName}
                              {member.isCurrentUser ? " · Tu" : ""}
                            </b>
                            <small>{roleLabel[member.role]}</small>
                          </div>
                          <div className="member-actions">
                            {detail.role === "owner" && member.role !== "owner" && (
                              <>
                                <button
                                  className="soft-button compact"
                                  disabled={busy}
                                  onClick={() =>
                                    void updateMember(member.userId, {
                                      operation: "role",
                                      role:
                                        member.role === "moderator"
                                          ? "member"
                                          : "moderator",
                                    })
                                  }
                                >
                                  <ShieldCheck />
                                  {member.role === "moderator" ? "Rendi membro" : "Rendi moderatore"}
                                </button>
                                <button
                                  className="soft-button compact"
                                  disabled={busy}
                                  onClick={() =>
                                    setConfirm({
                                      title: `Trasferire la classe a ${member.displayName}?`,
                                      description:
                                        "Diventerà proprietario e tu resterai nella classe come membro.",
                                      label: "Trasferisci",
                                      run: () => updateMember(member.userId, { operation: "transfer" }),
                                    })
                                  }
                                >
                                  <Crown /> Trasferisci
                                </button>
                              </>
                            )}
                            {canRemove && (
                              <button
                                className="icon-button danger"
                                aria-label={`Rimuovi ${member.displayName}`}
                                onClick={() =>
                                  setConfirm({
                                    title: `Rimuovere ${member.displayName}?`,
                                    description:
                                      "L’accesso alla classe verrà revocato immediatamente.",
                                    label: "Rimuovi",
                                    run: async () => {
                                      await request(
                                        `/api/classes/${detail.id}/members/${member.userId}`,
                                        { method: "DELETE", body: "{}" },
                                      );
                                      await loadClasses(detail.id);
                                    },
                                  })
                                }
                              >
                                <UserMinus />
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>

                {canManageInvites && (
                  <section className="panel invites-panel">
                    <div className="panel-title">
                      <div>
                        <span className="eyebrow">Accesso</span>
                        <h3>Inviti attivi</h3>
                      </div>
                      <button
                        onClick={() => {
                          setCreatedInvite(null);
                          setInviteOpen(true);
                        }}
                      >
                        Nuovo
                      </button>
                    </div>
                    {activeInvites.length ? (
                      <div className="invite-list">
                        {activeInvites.map((invite) => (
                          <article key={invite.id}>
                            <Link2 />
                            <div>
                              <b>
                                {invite.uses}/{invite.maxUses} ingressi
                              </b>
                              <small>
                                Scade {invite.expiresAt ? dateLabel(invite.expiresAt) : "mai"}
                              </small>
                            </div>
                            <button
                              className="soft-button compact"
                              onClick={() =>
                                setConfirm({
                                  title: "Revocare questo invito?",
                                  description:
                                    "Il link e il codice non permetteranno più nuovi ingressi.",
                                  label: "Revoca",
                                  run: async () => {
                                    await request(
                                      `/api/classes/${detail.id}/invites/${invite.id}`,
                                      { method: "DELETE", body: "{}" },
                                    );
                                    await loadDetail(detail.id);
                                  },
                                })
                              }
                            >
                              Revoca
                            </button>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="class-muted">Nessun invito attivo.</p>
                    )}
                  </section>
                )}

                <section className="class-danger-zone">
                  {detail.role === "owner" ? (
                    <button
                      className="soft-button danger-text"
                      onClick={() =>
                        setConfirm({
                          title: `Eliminare “${detail.name}”?`,
                          description:
                            "Membri e inviti verranno rimossi. Questa azione non tocca i diari personali.",
                          label: "Elimina classe",
                          run: async () => {
                            await request(`/api/classes/${detail.id}`, {
                              method: "DELETE",
                              body: "{}",
                            });
                            await loadClasses();
                            await agenda.refresh();
                          },
                        })
                      }
                    >
                      <Trash2 /> Elimina classe
                    </button>
                  ) : (
                    <button
                      className="soft-button danger-text"
                      onClick={() =>
                        setConfirm({
                          title: `Uscire da “${detail.name}”?`,
                          description: "Per rientrare servirà un nuovo invito valido.",
                          label: "Esci dalla classe",
                          run: async () => {
                            await request(
                              `/api/classes/${detail.id}/members/${currentUserId}`,
                              { method: "DELETE", body: "{}" },
                            );
                            await loadClasses();
                            await agenda.refresh();
                          },
                        })
                      }
                    >
                      <DoorOpen /> Esci dalla classe
                    </button>
                  )}
                </section>
                  </div>
                </details>
              </>
            )}
          </div>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="entry-dialog">
          <DialogHeader>
            <DialogTitle>Crea una classe</DialogTitle>
            <DialogDescription>
              Sarai il proprietario. Potrai invitare compagni e nominare moderatori.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitCreate}>
            <fieldset className="form-grid" disabled={busy}>
              <label className="full">
                Nome della classe
                <input name="name" required minLength={2} maxLength={80} />
              </label>
              <label className="full">
                Descrizione
                <textarea name="description" maxLength={500} rows={3} />
              </label>
              <label className="full">
                Il tuo nome nella classe
                <input
                  name="displayName"
                  required
                  maxLength={80}
                  defaultValue={defaultDisplayName}
                />
              </label>
            </fieldset>
            <DialogFooter>
              <button className="primary-button" disabled={busy}>
                {busy ? "Creazione…" : "Crea classe"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="entry-dialog">
          <DialogHeader>
            <DialogTitle>Unisciti a una classe</DialogTitle>
            <DialogDescription>
              Inserisci il codice ricevuto. Nella classe non verranno condivisi voti o assenze.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitJoin}>
            <fieldset className="form-grid" disabled={busy}>
              <label className="full">
                Codice invito
                <input
                  name="code"
                  required
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="ABCD-EFGH-JKLM"
                />
              </label>
              <label className="full">
                Il tuo nome nella classe
                <input
                  name="displayName"
                  required
                  maxLength={80}
                  defaultValue={defaultDisplayName}
                />
              </label>
            </fieldset>
            <DialogFooter>
              <button className="primary-button" disabled={busy}>
                {busy ? "Ingresso…" : "Entra nella classe"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={inviteOpen}
        onOpenChange={(open) => {
          setInviteOpen(open);
          if (!open) setCreatedInvite(null);
        }}
      >
        <DialogContent className="entry-dialog">
          <DialogHeader>
            <DialogTitle>{createdInvite ? "Invito pronto" : "Crea un invito"}</DialogTitle>
            <DialogDescription>
              {createdInvite
                ? "Condividi il link o il codice fuori da iPagell. Sarà mostrato solo ora."
                : "Scegli durata e numero massimo di ingressi."}
            </DialogDescription>
          </DialogHeader>
          {createdInvite ? (
            <div className="invite-result">
              <span>Codice invito</span>
              <strong>{createdInvite.code}</strong>
              <button
                className="primary-button"
                onClick={() => {
                  void navigator.clipboard.writeText(inviteLink).then(() => toast.success("Link copiato")).catch(() => toast.error("Copia non disponibile. Condividi il codice mostrato."));
                }}
              >
                <Clipboard /> Copia link
              </button>
              <small>
                Scade {createdInvite.expiresAt ? dateLabel(createdInvite.expiresAt) : "mai"} · massimo {createdInvite.maxUses} ingressi
              </small>
            </div>
          ) : (
            <form onSubmit={submitInvite}>
              <fieldset className="form-grid" disabled={busy}>
                <label>
                  Scadenza
                  <NativeSelect name="expiresInDays" defaultValue="7">
                    <NativeSelectOption value="1">1 giorno</NativeSelectOption>
                    <NativeSelectOption value="7">7 giorni</NativeSelectOption>
                    <NativeSelectOption value="14">14 giorni</NativeSelectOption>
                    <NativeSelectOption value="30">30 giorni</NativeSelectOption>
                  </NativeSelect>
                </label>
                <label>
                  Ingressi massimi
                  <input name="maxUses" type="number" min={1} max={50} defaultValue={50} />
                </label>
              </fieldset>
              <DialogFooter>
                <button className="primary-button" disabled={busy}>
                  {busy ? "Creazione…" : "Genera invito"}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="entry-dialog">
          <DialogHeader>
            <DialogTitle>Modifica classe</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitEdit} key={detail?.id}>
            <fieldset className="form-grid" disabled={busy}>
              <label className="full">
                Nome
                <input name="name" required maxLength={80} defaultValue={detail?.name} />
              </label>
              <label className="full">
                Descrizione
                <textarea name="description" maxLength={500} defaultValue={detail?.description} rows={3} />
              </label>
            </fieldset>
            <DialogFooter>
              <button className="primary-button" disabled={busy}>Salva modifiche</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={nameOpen} onOpenChange={setNameOpen}>
        <DialogContent className="entry-dialog">
          <DialogHeader>
            <DialogTitle>Il tuo nome nella classe</DialogTitle>
            <DialogDescription>
              È l’unico nome mostrato agli altri membri.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitDisplayName} key={detail?.displayName}>
            <fieldset className="form-grid" disabled={busy}>
              <label className="full">
                Nome visibile
                <input name="displayName" required maxLength={80} defaultValue={detail?.displayName} />
              </label>
            </fieldset>
            <DialogFooter>
              <button className="primary-button" disabled={busy}>Salva nome</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent className="confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="danger-action"
              disabled={busy}
              onClick={(event) => {
                event.preventDefault();
                if (!confirm) return;
                setBusy(true);
                void confirm
                  .run()
                  .then(() => {
                    setConfirm(null);
                    toast.success("Operazione completata");
                  })
                  .catch((cause) =>
                    toast.error(cause instanceof Error ? cause.message : "Operazione non riuscita"),
                  )
                  .finally(() => setBusy(false));
              }}
            >
              {confirm?.label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
