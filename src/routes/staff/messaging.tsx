import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader, Panel, Pill, btnPrimary, btnSecondary, btnGhost, inputCls } from "@/components/staff/ui";
import { myChannels, createChannel, channelMessages, sendChannelMessage, markChannelRead, staffDirectory, toggleReaction } from "@/lib/m7";
import { useRealtimeChannel } from "@/lib/data/portal";
import { Plus, Send, X, Hash, Users, Smile } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/staff/messaging")({ component: MessagingPage });

const EMOJI = ["👍","❤️","🎉","🚀","👀","✅"];

function MessagingPage() {
  const [channels, setChannels] = useState<any[]>([]);
  const [active, setActive] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [draft, setDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [me, setMe] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null)); }, []);

  const loadChannels = async () => {
    const c = await myChannels();
    setChannels(c);
    if (!active && c.length) setActive(c[0]);
  };
  useEffect(() => { loadChannels(); /* eslint-disable-next-line */ }, []);

  const loadMessages = async () => {
    if (!active) return;
    const m = await channelMessages(active.id);
    setMessages(m);
    await markChannelRead(active.id);
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 50);
  };
  useEffect(() => { loadMessages(); /* eslint-disable-next-line */ }, [active?.id]);

  useRealtimeChannel(`msgs-${active?.id ?? "none"}`, active ? [{ table: "channel_messages", filter: `channel_id=eq.${active.id}` }] : [], loadMessages);

  const send = async () => {
    if (!draft.trim() || !active) return;
    const text = draft;
    setDraft("");
    try { await sendChannelMessage(active.id, text); }
    catch (e: any) { toast.error(e.message); setDraft(text); }
  };

  return (
    <div>
      <PageHeader eyebrow="COLLABORATION" title="Internal Messaging" subtitle="Direct messages and team channels for staff."
        action={<button className={btnPrimary} onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New channel</button>} />

      <div className="grid lg:grid-cols-[260px_minmax(0,1fr)] gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        <Panel padded={false} className="overflow-y-auto">
          <div className="px-3 py-3 text-[10px] font-mono tracking-[0.25em] text-muted-foreground border-b border-border">CHANNELS · {channels.length}</div>
          <ul>
            {channels.map((c) => (
              <li key={c.id}>
                <button onClick={() => setActive(c)} className={`w-full text-left px-3 py-2.5 flex items-center gap-2 text-sm hover:bg-surface/60 ${active?.id === c.id ? "bg-accent-blue/10 text-accent-blue" : ""}`}>
                  {c.channel_type === "direct" ? <Users className="h-3.5 w-3.5" /> : <Hash className="h-3.5 w-3.5" />}
                  <span className="truncate flex-1">{c.name ?? "Direct message"}</span>
                  <span className="text-[10px] text-muted-foreground">{c.channel_type}</span>
                </button>
              </li>
            ))}
            {channels.length === 0 && <li className="p-4 text-center text-xs text-muted-foreground">No channels. Create one to start messaging.</li>}
          </ul>
        </Panel>

        <Panel padded={false} className="flex flex-col overflow-hidden">
          {active ? (
            <>
              <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                {active.channel_type === "direct" ? <Users className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                <div className="font-semibold">{active.name ?? "Direct message"}</div>
                {active.description && <div className="text-xs text-muted-foreground ml-2">{active.description}</div>}
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => (
                  <MessageRow key={m.id} m={m} mine={m.sender_id === me} />
                ))}
                {messages.length === 0 && <div className="text-center text-sm text-muted-foreground py-8">No messages yet — say hi 👋</div>}
              </div>
              <div className="border-t border-border p-3 flex gap-2">
                <input className={`${inputCls} flex-1`} placeholder="Type a message — @mention staff" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())} />
                <button className={btnPrimary} onClick={send}><Send className="h-4 w-4" /></button>
              </div>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-sm text-muted-foreground">Select or create a channel.</div>
          )}
        </Panel>
      </div>

      {creating && <ChannelCreate onClose={() => setCreating(false)} onCreated={(c: any) => { setCreating(false); loadChannels(); setActive(c); }} />}
    </div>
  );
}

function MessageRow({ m, mine }: any) {
  const [showEmoji, setShowEmoji] = useState(false);
  return (
    <div className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
      <div className="h-8 w-8 shrink-0 rounded-full bg-secondary grid place-items-center text-xs font-medium">
        {(m.sender?.display_name ?? m.sender?.email ?? "?").slice(0, 1).toUpperCase()}
      </div>
      <div className={`max-w-[75%] ${mine ? "items-end" : ""} flex flex-col`}>
        <div className="text-[10px] text-muted-foreground mb-0.5 flex gap-2">
          <span>{m.sender?.display_name ?? m.sender?.email ?? "—"}</span>
          <span className="font-mono">{new Date(m.created_at).toLocaleTimeString()}</span>
        </div>
        <div className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words ${mine ? "bg-accent-blue/15 text-foreground" : "bg-surface/70"}`}>
          {m.content}
        </div>
        {Array.isArray(m.mentions) && m.mentions.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">{m.mentions.map((x: string) => <Pill key={x} tone="info">@{x}</Pill>)}</div>
        )}
        <div className="relative mt-1">
          <button className={btnGhost} onClick={() => setShowEmoji((s) => !s)} style={{ height: 22, padding: "0 6px" }}><Smile className="h-3 w-3" /></button>
          {showEmoji && (
            <div className="absolute z-10 mt-1 bg-background border border-border rounded-md p-1 flex gap-1 shadow-lg">
              {EMOJI.map((e) => <button key={e} className="h-6 w-6 hover:bg-surface/60 rounded" onClick={async () => { await toggleReaction(m.id, e); setShowEmoji(false); }}>{e}</button>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChannelCreate({ onClose, onCreated }: any) {
  const [type, setType] = useState<"public" | "private" | "direct">("public");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [dir, setDir] = useState<any[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  useEffect(() => { staffDirectory().then(setDir); }, []);
  const submit = async () => {
    try {
      const c = await createChannel({ channel_type: type, name: type === "direct" ? undefined : name, description: desc, member_ids: picked });
      toast.success("Channel created");
      onCreated(c);
    } catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="glass-card rounded-xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between mb-3"><h2 className="text-base font-semibold">New channel</h2><button className={btnGhost} onClick={onClose}><X className="h-4 w-4" /></button></div>
        <select className={`${inputCls} w-full mb-2`} value={type} onChange={(e) => setType(e.target.value as any)}>
          <option value="public">Public channel</option>
          <option value="private">Private channel</option>
          <option value="direct">Direct message</option>
        </select>
        {type !== "direct" && (
          <>
            <input className={`${inputCls} w-full mb-2`} placeholder="Channel name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className={`${inputCls} w-full mb-2`} placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </>
        )}
        <div className="text-xs text-muted-foreground mb-1">Add members:</div>
        <div className="max-h-[200px] overflow-y-auto border border-border rounded-md divide-y divide-border">
          {dir.map((u: any) => (
            <label key={u.id} className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-surface/60">
              <input type="checkbox" checked={picked.includes(u.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, u.id] : picked.filter((x) => x !== u.id))} />
              <span>{u.display_name ?? u.email}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-3"><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={submit}>Create</button></div>
      </div>
    </div>
  );
}
