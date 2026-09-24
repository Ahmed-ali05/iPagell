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
import { LanguageSelect, useI18n } from "@/components/i18n-provider";
import { formatDate, selectPlural } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";

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
    throw new Error(data.error ?? "CLASS_REQUEST_FAILED");
  return data;
}

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
  const { t, locale } = useI18n();
  const dateLabel = (value: number) => formatDate(locale, new Date(value), { day: "numeric", month: "short", year: "numeric" });
  const detailSequence = useRef(0);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ClassDetail | null>(null);
  const [invites, setInvites] = useState<ClassInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
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
      setError(null);
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
        .catch(() => setError("classes.unavailable"))
        .finally(() => setLoading(false));
    });
  }, [loadClasses]);

  async function selectClass(id: string) {
    if (id === selectedId) return;
    setSelectedId(id);
    setDetail(null);
    setError(null);
    try {
      await loadDetail(id);
    } catch {
      setError("classes.classUnavailable");
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
      toast.success(t("classes.created"));
    } catch {
      toast.error(t("classes.notCreated"));
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
      toast.success(t("classes.joined", { name: result.class.name }));
    } catch {
      toast.error(t("classes.notJoined"));
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
    } catch {
      toast.error(t("classes.inviteNotCreated"));
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
      toast.success(t("classes.updated"));
    } catch {
      toast.error(t("classes.operationFailed"));
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
      toast.success(t("classes.nameUpdated"));
    } catch {
      toast.error(t("classes.operationFailed"));
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
      toast.success(input.operation === "transfer" ? t("classes.transferDone") : t("classes.roleUpdated"));
    } catch {
      toast.error(t("classes.operationFailed"));
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
        <RefreshCw /> <span>{t("classes.loading")}</span>
      </section>
    );

  return (
    <>
      <div className="classes-toolbar">
        <div>
          <span className="section-label">{t("classes.title")}</span>
        </div>
        <div>
          <button className="soft-button" onClick={() => setJoinOpen(true)}>
            <DoorOpen /> {t("classes.enterCode")}
          </button>
          <button className="primary-button" onClick={() => setCreateOpen(true)}>
            <Plus /> {t("classes.new")}
          </button>
        </div>
      </div>

      {error && (
        <section className="sync-banner" role="alert">
          <p>{t(error)}</p>
          <button className="soft-button" onClick={() => void loadClasses().catch(() => setError("classes.unavailable"))}>
            {t("classes.retry")}
          </button>
        </section>
      )}

      {!classes.length ? (
        <section className="panel class-empty">
          <UsersRound />
          <h2>{t("classes.firstTitle")}</h2>
          <p>
            {t("classes.firstHint")}
          </p>
          <div>
            <button className="primary-button" onClick={() => setCreateOpen(true)}>
              {t("classes.create")}
            </button>
            <button className="soft-button" onClick={() => setJoinOpen(true)}>
              {t("classes.haveCode")}
            </button>
          </div>
        </section>
      ) : (
        <div className="classes-layout">
          <aside className="panel class-switcher" aria-label={t("classes.title")}>
            <div className="panel-title">
              <div>
                <span className="section-label">{t("classes.title")}</span>
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
                      {item.memberCount} {t(selectPlural(locale, item.memberCount, "classes.member", "classes.members"))}
                    </small>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <div className="class-detail-stack">
            {!detail ? (
              <section className="panel classes-loading">{t("classes.loadingDetail")}</section>
            ) : (
              <>
                <section className="class-hero">
                  <div>
                    <span className="class-role">{t(`classes.role.${detail.role}` as "classes.role.owner" | "classes.role.moderator" | "classes.role.member")}</span>
                    <h2>{detail.name}</h2>
                    <p>{detail.description || t("classes.noDescription")}</p>
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
                        <Link2 /> {t("classes.createInvite")}
                      </button>
                    )}
                    {detail.role === "owner" && (
                      <button className="soft-button" onClick={() => setEditOpen(true)}>
                        <Pencil /> {t("classes.edit")}
                      </button>
                    )}
                  </div>
                </section>

                <ClassEventsPanel key={detail.id} detail={detail} userId={currentUserId} data={data} semesterId={semesterId} controller={agenda} />

                <details className="class-administration">
                  <summary>{t("classes.management")} <span>{detail.memberCount} {t(selectPlural(locale, detail.memberCount, "classes.member", "classes.members"))}</span></summary>
                  <div className="class-detail-stack">
                <section className="panel members-panel">
                  <div className="panel-title">
                    <div>
                      <h3>{detail.memberCount} {t("classes.members")}</h3>
                    </div>
                    <button onClick={() => setNameOpen(true)}>{t("classes.myName")}</button>
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
                              {member.isCurrentUser ? ` · ${t("common.you")}` : ""}
                            </b>
                            <small>{t(`classes.role.${member.role}` as "classes.role.owner" | "classes.role.moderator" | "classes.role.member")}</small>
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
                                  {member.role === "moderator" ? t("classes.makeMember") : t("classes.makeModerator")}
                                </button>
                                <button
                                  className="soft-button compact"
                                  disabled={busy}
                                  onClick={() =>
                                    setConfirm({
                                      title: t("classes.transferConfirm", { name: member.displayName }),
                                      description:
                                        t("classes.transferWarning"),
                                      label: t("classes.transfer"),
                                      run: () => updateMember(member.userId, { operation: "transfer" }),
                                    })
                                  }
                                >
                                  <Crown /> {t("classes.transfer")}
                                </button>
                              </>
                            )}
                            {canRemove && (
                              <button
                                className="icon-button danger"
                                aria-label={t("classes.removeMember", { name: member.displayName })}
                                onClick={() =>
                                  setConfirm({
                                    title: t("classes.removeMemberConfirm", { name: member.displayName }),
                                    description: t("classes.removeAccess"),
                                    label: t("classes.remove"),
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
                        <h3>{t("classes.activeInvites")}</h3>
                      </div>
                      <button
                        onClick={() => {
                          setCreatedInvite(null);
                          setInviteOpen(true);
                        }}
                      >
                        {t("classes.newInvite")}
                      </button>
                    </div>
                    {activeInvites.length ? (
                      <div className="invite-list">
                        {activeInvites.map((invite) => (
                          <article key={invite.id}>
                            <Link2 />
                            <div>
                              <b>
                                {invite.uses}/{invite.maxUses} {t("classes.entries")}
                              </b>
                              <small>
                                {t("classes.expires")} {invite.expiresAt ? dateLabel(invite.expiresAt) : t("classes.never")}
                              </small>
                            </div>
                            <button
                              className="soft-button compact"
                              onClick={() =>
                                setConfirm({
                                  title: t("classes.revokeConfirm"),
                                  description: t("classes.revokeWarning"),
                                  label: t("classes.revoke"),
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
                              {t("classes.revoke")}
                            </button>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="class-muted">{t("classes.noInvites")}</p>
                    )}
                  </section>
                )}

                <section className="class-danger-zone">
                  {detail.role === "owner" ? (
                    <button
                      className="soft-button danger-text"
                      onClick={() =>
                        setConfirm({
                          title: t("classes.deleteClassConfirm", { name: detail.name }),
                          description: t("classes.deleteClassWarning"),
                          label: t("classes.deleteClass"),
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
                      <Trash2 /> {t("classes.deleteClass")}
                    </button>
                  ) : (
                    <button
                      className="soft-button danger-text"
                      onClick={() =>
                        setConfirm({
                          title: t("classes.leaveConfirm", { name: detail.name }),
                          description: t("classes.leaveWarning"),
                          label: t("classes.leaveClass"),
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
                      <DoorOpen /> {t("classes.leaveClass")}
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
            <DialogTitle>{t("classes.create")}</DialogTitle>
            <DialogDescription>
              {t("classes.createOwnerHint")}
            </DialogDescription>
            <LanguageSelect className="language-select" />
          </DialogHeader>
          <form onSubmit={submitCreate}>
            <fieldset className="form-grid" disabled={busy}>
              <label className="full">
                {t("classes.className")}
                <input name="name" required minLength={2} maxLength={80} />
              </label>
              <label className="full">
                {t("classes.description")}
                <textarea name="description" maxLength={500} rows={3} />
              </label>
              <label className="full">
                {t("classes.displayName")}
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
                {busy ? t("classes.creating") : t("classes.create")}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="entry-dialog">
          <DialogHeader>
            <DialogTitle>{t("classes.joinTitle")}</DialogTitle>
            <DialogDescription>
              {t("classes.joinHint")}
            </DialogDescription>
            <LanguageSelect className="language-select" />
          </DialogHeader>
          <form onSubmit={submitJoin}>
            <fieldset className="form-grid" disabled={busy}>
              <label className="full">
                {t("classes.inviteCode")}
                <input
                  name="code"
                  required
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder={t("classes.codePlaceholder")}
                />
              </label>
              <label className="full">
                {t("classes.displayName")}
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
                {busy ? t("classes.joining") : t("classes.join")}
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
            <DialogTitle>{createdInvite ? t("classes.inviteReady") : t("classes.createInviteTitle")}</DialogTitle>
            <DialogDescription>
              {createdInvite
                ? t("classes.inviteShareHint")
                : t("classes.inviteOptionsHint")}
            </DialogDescription>
            <LanguageSelect className="language-select" />
          </DialogHeader>
          {createdInvite ? (
            <div className="invite-result">
              <span>{t("classes.inviteCode")}</span>
              <strong>{createdInvite.code}</strong>
              <button
                className="primary-button"
                onClick={() => {
                  void navigator.clipboard.writeText(inviteLink).then(() => toast.success(t("classes.linkCopied"))).catch(() => toast.error(t("classes.copyUnavailable")));
                }}
              >
                <Clipboard /> {t("classes.copyLink")}
              </button>
              <small>
                {t("classes.expires")} {createdInvite.expiresAt ? dateLabel(createdInvite.expiresAt) : t("classes.never")} · {t("classes.maxEntries", { count: createdInvite.maxUses })}
              </small>
            </div>
          ) : (
            <form onSubmit={submitInvite}>
              <fieldset className="form-grid" disabled={busy}>
                <label>
                  {t("classes.expiration")}
                  <NativeSelect name="expiresInDays" defaultValue="7">
                    <NativeSelectOption value="1">{t("classes.days", { count: 1 })}</NativeSelectOption>
                    <NativeSelectOption value="7">{t("classes.days", { count: 7 })}</NativeSelectOption>
                    <NativeSelectOption value="14">{t("classes.days", { count: 14 })}</NativeSelectOption>
                    <NativeSelectOption value="30">{t("classes.days", { count: 30 })}</NativeSelectOption>
                  </NativeSelect>
                </label>
                <label>
                  {t("classes.maxEntriesLabel")}
                  <input name="maxUses" type="number" min={1} max={50} defaultValue={50} />
                </label>
              </fieldset>
              <DialogFooter>
                <button className="primary-button" disabled={busy}>
                  {busy ? t("classes.creating") : t("classes.generateInvite")}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="entry-dialog">
          <DialogHeader>
            <DialogTitle>{t("classes.editTitle")}</DialogTitle>
            <LanguageSelect className="language-select" />
          </DialogHeader>
          <form onSubmit={submitEdit} key={detail?.id}>
            <fieldset className="form-grid" disabled={busy}>
              <label className="full">
                {t("classes.name")}
                <input name="name" required maxLength={80} defaultValue={detail?.name} />
              </label>
              <label className="full">
                {t("classes.description")}
                <textarea name="description" maxLength={500} defaultValue={detail?.description} rows={3} />
              </label>
            </fieldset>
            <DialogFooter>
              <button className="primary-button" disabled={busy}>{t("classes.saveChanges")}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={nameOpen} onOpenChange={setNameOpen}>
        <DialogContent className="entry-dialog">
          <DialogHeader>
            <DialogTitle>{t("classes.displayName")}</DialogTitle>
            <DialogDescription>
              {t("classes.onlyNameShown")}
            </DialogDescription>
            <LanguageSelect className="language-select" />
          </DialogHeader>
          <form onSubmit={submitDisplayName} key={detail?.displayName}>
            <fieldset className="form-grid" disabled={busy}>
              <label className="full">
                {t("classes.visibleName")}
                <input name="displayName" required maxLength={80} defaultValue={detail?.displayName} />
              </label>
            </fieldset>
            <DialogFooter>
              <button className="primary-button" disabled={busy}>{t("classes.saveName")}</button>
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
            <AlertDialogCancel>{t("classes.cancel")}</AlertDialogCancel>
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
                    toast.success(t("classes.done"));
                  })
                  .catch(() =>
                    toast.error(t("classes.operationFailed")),
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
