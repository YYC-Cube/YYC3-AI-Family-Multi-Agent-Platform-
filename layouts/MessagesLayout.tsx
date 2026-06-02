/**
 * file: MessagesLayout.tsx
 * description: /ai-family-messages 私信系统主布局 · 档案 §1.5
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v1.0.0
 * created: 2026-06-02
 * updated: 2026-06-02
 * status: stable
 * tags: [layout],[messages],[archive-§1.5]
 *
 * brief: 三栏私信布局 — 家人列表 | 对话窗口 | 群发/搜索面板
 *
 * dependencies: react-router, services/family-messages, types/family-manifest
 * exports: MessagesLayout (default)
 * notes:
 *   - 路由：/ai-family-messages
 *   - 功能：1v1 私信、群发、消息搜索、温馨提醒动画
 */

import { ArrowLeft, MessageCircle, Search, Send, Sparkles, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import {
  getFamilyMessageService,
  type FamilyMessage,
  type FamilyThread,
  type MessageParticipant,
} from '../services/family-messages';
import type { RoleId } from '../types/family-manifest';
import { ALL_ROLE_IDS, FAMILY_ROLES } from '../types/family-manifest';

type ViewMode = 'direct' | 'broadcast' | 'search';

const SELF: MessageParticipant = 'USER';

// ==========================================
// 主布局
// ==========================================
export default function MessagesLayout() {
  const svc = useMemo(() => getFamilyMessageService(), []);
  const [threads, setThreads] = useState<FamilyThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<FamilyMessage[]>([]);
  const [mode, setMode] = useState<ViewMode>('direct');
  const [selectedRecipients, setSelectedRecipients] = useState<RoleId[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<FamilyMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [sending, setSending] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);

  // ── 加载会话列表 ──
  const refreshThreads = useCallback(async () => {
    setLoadingThreads(true);
    try {
      const list = await svc.listThreads(SELF);
      setThreads(list);
    } catch (err) {
      console.warn('[MessagesLayout] load threads failed', err);
    } finally {
      setLoadingThreads(false);
    }
  }, [svc]);

  // ── 加载未读 ──
  const refreshUnread = useCallback(async () => {
    try {
      const count = await svc.unreadCount(SELF);
      setUnread(count);
    } catch (err) {
      console.warn('[MessagesLayout] load unread failed', err);
    }
  }, [svc]);

  useEffect(() => {
    refreshThreads();
    refreshUnread();
  }, [refreshThreads, refreshUnread]);

  // ── 加载选中会话的消息 ──
  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const msgs = await svc.getMessages(selectedThreadId, 200);
        if (!cancelled) {
          setMessages(msgs);
          // 自动标记已读
          await svc.markRead(selectedThreadId, SELF).catch(() => { });
          refreshUnread();
        }
      } catch (err) {
        console.warn('[MessagesLayout] load messages failed', err);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedThreadId, svc, refreshUnread]);

  // ── 发送消息 ──
  const handleSend = useCallback(async (content: string) => {
    if (!content.trim()) return;
    setSending(true);
    try {
      let recipientIds: MessageParticipant[];
      if (mode === 'direct') {
        if (selectedRecipients.length !== 1) return;
        recipientIds = [selectedRecipients[0]];
      } else if (mode === 'broadcast') {
        if (selectedRecipients.length === 0) return;
        recipientIds = [...selectedRecipients];
      } else {
        return;
      }
      const result = await svc.send({
        senderId: SELF,
        recipientIds,
        content: content.trim(),
        messageType: 'text',
      });
      setSelectedThreadId(result.threadId);
      setSelectedRecipients([]);
      await refreshThreads();
      const msgs = await svc.getMessages(result.threadId, 200);
      setMessages(msgs);
    } catch (err) {
      console.error('[MessagesLayout] send failed', err);
    } finally {
      setSending(false);
    }
  }, [mode, selectedRecipients, svc, refreshThreads]);

  // ── 搜索 ──
  const handleSearch = useCallback(async () => {
    if (!searchKeyword.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await svc.search(searchKeyword.trim());
      setSearchResults(results);
    } catch (err) {
      console.warn('[MessagesLayout] search failed', err);
    }
  }, [searchKeyword, svc]);

  // ── 点击会话 ──
  const handleSelectThread = useCallback((threadId: string) => {
    setSelectedThreadId(threadId);
    setMode('direct');
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      const others = svc.parseParticipantIds(thread).filter(p => p !== SELF);
      setSelectedRecipients(others.filter(o => o !== 'USER') as RoleId[]);
    }
  }, [threads, svc]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col">
        {/* Header */}
        <header className="border-b border-white/5 backdrop-blur-md bg-slate-950/50 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-sky-400" />
            <h1 className="text-lg font-mono tracking-wide">
              <span className="text-sky-400">YYC³</span> · 家人私信
            </h1>
            {unread > 0 && (
              <Badge variant="destructive" className="ml-2 animate-pulse">
                {unread} 未读
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle mode={mode} onChange={setMode} />
          </div>
        </header>

        {/* Body — 3 columns */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[280px_1fr_320px] gap-3 p-3 overflow-hidden">
          {/* ── Col 1: 会话/家人列表 ── */}
          <Card className="bg-slate-900/40 border-white/5 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-white/5">
              <h2 className="text-xs uppercase tracking-widest text-slate-400 font-mono">
                {mode === 'broadcast' ? '选择群发对象' : mode === 'search' ? '搜索历史消息' : '家人 & 会话'}
              </h2>
            </div>
            <ScrollArea className="flex-1">
              {mode === 'search' ? (
                <SearchPanel
                  keyword={searchKeyword}
                  onKeywordChange={setSearchKeyword}
                  onSearch={handleSearch}
                  results={searchResults}
                  onSelectMessage={(msg) => {
                    setSelectedThreadId(msg.thread_id);
                    setMode('direct');
                  }}
                />
              ) : mode === 'broadcast' ? (
                <RecipientPicker
                  selected={selectedRecipients}
                  onChange={setSelectedRecipients}
                />
              ) : (
                <ThreadsList
                  threads={threads}
                  loading={loadingThreads}
                  selectedId={selectedThreadId}
                  onSelect={handleSelectThread}
                  onPickMember={(rid) => {
                    setSelectedRecipients([rid]);
                    const tid = svc.buildThreadId([SELF, rid], false);
                    setSelectedThreadId(tid);
                  }}
                />
              )}
            </ScrollArea>
          </Card>

          {/* ── Col 2: 对话窗口 ── */}
          <Card className="bg-slate-900/40 border-white/5 overflow-hidden flex flex-col">
            <ConversationHeader
              threadId={selectedThreadId}
              recipients={selectedRecipients}
              mode={mode}
              onBack={() => { setSelectedThreadId(null); setMessages([]); }}
            />
            <MessageList messages={messages} selfId={SELF} />
            <MessageComposer onSend={handleSend} disabled={sending || (mode !== 'search' && selectedRecipients.length === 0)} />
          </Card>

          {/* ── Col 3: 群发/快捷面板 ── */}
          <Card className="bg-slate-900/40 border-white/5 overflow-hidden flex-col hidden md:flex">
            <div className="p-3 border-b border-white/5">
              <h2 className="text-xs uppercase tracking-widest text-slate-400 font-mono flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> 八位家人
              </h2>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {ALL_ROLE_IDS.map(rid => {
                  const role = FAMILY_ROLES[rid];
                  return (
                    <Tooltip key={rid}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            setMode('direct');
                            setSelectedRecipients([rid]);
                            const tid = svc.buildThreadId([SELF, rid], false);
                            setSelectedThreadId(tid);
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition group text-left"
                        >
                          <span className="text-xl">{role.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate" style={{ color: role.color }}>
                              {role.name}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate font-mono">
                              {role.englishName} · {role.roleTitle}
                            </div>
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="text-xs italic">"{role.motto}"</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </ScrollArea>
            <div className="p-3 border-t border-white/5">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-white/10 hover:bg-white/5"
                onClick={() => setMode('broadcast')}
              >
                <Users className="w-4 h-4 mr-2" />
                群发多位家人
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ==========================================
// 子组件
// ==========================================

function ModeToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  const items: { id: ViewMode; label: string }[] = [
    { id: 'direct', label: '1v1' },
    { id: 'broadcast', label: '群发' },
    { id: 'search', label: '搜索' },
  ];
  return (
    <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
      {items.map(it => (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
          className={`px-3 py-1 text-xs font-mono rounded transition ${mode === it.id
              ? 'bg-sky-500/30 text-sky-300'
              : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function ThreadsList({
  threads, loading, selectedId, onSelect, onPickMember,
}: {
  threads: FamilyThread[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPickMember: (rid: RoleId) => void;
}) {
  const svc = useMemo(() => getFamilyMessageService(), []);

  if (loading) {
    return <div className="p-4 text-xs text-slate-500 font-mono">加载会话中...</div>;
  }

  return (
    <div className="p-2 space-y-3">
      {/* ── 直接发起新会话 ── */}
      <div>
        <div className="px-2 py-1 text-[10px] uppercase text-slate-500 font-mono tracking-wider">发起对话</div>
        {ALL_ROLE_IDS.map(rid => {
          const role = FAMILY_ROLES[rid];
          return (
            <button
              key={rid}
              onClick={() => onPickMember(rid)}
              className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-white/5 transition text-left"
            >
              <span className="text-lg">{role.emoji}</span>
              <span className="text-sm" style={{ color: role.color }}>{role.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── 历史会话 ── */}
      {threads.length > 0 && (
        <div>
          <div className="px-2 py-1 text-[10px] uppercase text-slate-500 font-mono tracking-wider">历史会话</div>
          {threads.map(t => {
            const others = svc.parseParticipantIds(t).filter(p => p !== SELF);
            const otherRoles = others.filter(o => o !== 'USER') as RoleId[];
            const isBroadcast = t.type === 'broadcast';
            const label = isBroadcast
              ? `群发 (${others.length}位)`
              : otherRoles.length > 0
                ? FAMILY_ROLES[otherRoles[0]]?.name || others[0]
                : others[0] || '?';
            const emoji = isBroadcast ? '📣' : (otherRoles[0] ? FAMILY_ROLES[otherRoles[0]]?.emoji : '💬');
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded transition text-left ${selectedId === t.id ? 'bg-sky-500/20 text-sky-200' : 'hover:bg-white/5'
                  }`}
              >
                <span className="text-lg">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{label}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {t.last_message_at ? new Date(t.last_message_at).toLocaleString('zh-CN', { hour12: false }) : '—'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecipientPicker({
  selected, onChange,
}: {
  selected: RoleId[];
  onChange: (rids: RoleId[]) => void;
}) {
  const toggle = (rid: RoleId) => {
    if (selected.includes(rid)) {
      onChange(selected.filter(r => r !== rid));
    } else {
      onChange([...selected, rid]);
    }
  };
  return (
    <div className="p-2 space-y-1">
      <div className="px-2 py-1 text-[10px] text-slate-500 font-mono">
        已选 {selected.length} / {ALL_ROLE_IDS.length}
      </div>
      {ALL_ROLE_IDS.map(rid => {
        const role = FAMILY_ROLES[rid];
        const checked = selected.includes(rid);
        return (
          <label
            key={rid}
            className="flex items-center gap-2 px-2 py-2 rounded hover:bg-white/5 cursor-pointer"
          >
            <Checkbox checked={checked} onCheckedChange={() => toggle(rid)} />
            <span className="text-lg">{role.emoji}</span>
            <span className="text-sm flex-1" style={{ color: role.color }}>{role.name}</span>
            <span className="text-[10px] text-slate-500 font-mono">{role.roleTitle}</span>
          </label>
        );
      })}
    </div>
  );
}

function SearchPanel({
  keyword, onKeywordChange, onSearch, results, onSelectMessage,
}: {
  keyword: string;
  onKeywordChange: (s: string) => void;
  onSearch: () => void;
  results: FamilyMessage[];
  onSelectMessage: (msg: FamilyMessage) => void;
}) {
  return (
    <div className="p-3 space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="搜索关键词..."
          value={keyword}
          onChange={e => onKeywordChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSearch(); }}
          className="bg-white/5 border-white/10 text-sm"
        />
        <Button size="sm" onClick={onSearch}>
          <Search className="w-4 h-4" />
        </Button>
      </div>
      <div className="space-y-1">
        {results.length === 0 ? (
          <p className="text-xs text-slate-500 font-mono px-1">
            {keyword ? '点击搜索查看结果' : '输入关键词搜索历史消息'}
          </p>
        ) : (
          results.map(msg => (
            <button
              key={msg.id}
              onClick={() => onSelectMessage(msg)}
              className="w-full text-left p-2 rounded hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] border-white/20 font-mono">
                  {msg.sender_id}
                </Badge>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(msg.created_at).toLocaleString('zh-CN', { hour12: false })}
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-2">{msg.content}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function ConversationHeader({
  threadId, recipients, mode, onBack,
}: {
  threadId: string | null;
  recipients: RoleId[];
  mode: ViewMode;
  onBack: () => void;
}) {
  const label = useMemo(() => {
    if (!threadId && recipients.length === 0) return '选择一位家人开始对话';
    if (mode === 'broadcast' || recipients.length > 1) {
      return `群发 ${recipients.length} 位家人`;
    }
    if (recipients.length === 1) {
      const role = FAMILY_ROLES[recipients[0]];
      return role ? `${role.emoji} ${role.name} · ${role.roleTitle}` : '对话';
    }
    return '对话';
  }, [threadId, recipients, mode]);

  return (
    <div className="p-3 border-b border-white/5 flex items-center gap-2">
      {threadId && (
        <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-400 hover:text-slate-100">
          <ArrowLeft className="w-4 h-4" />
        </Button>
      )}
      <h2 className="text-sm font-mono tracking-wide">{label}</h2>
    </div>
  );
}

function MessageList({ messages, selfId }: { messages: FamilyMessage[]; selfId: MessageParticipant }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-600 text-sm font-mono">
        <div className="text-center">
          <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>暂无消息，开启一段新的对话吧 🌹</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1" ref={scrollRef as any}>
      <div className="p-4 space-y-3">
        {messages.map(msg => {
          const isSelf = msg.sender_id === selfId;
          const senderRole = isSelf ? null : FAMILY_ROLES[msg.sender_id as RoleId];
          return (
            <div key={msg.id} className={`flex gap-2 ${isSelf ? 'flex-row-reverse' : ''}`}>
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback
                  style={{
                    background: senderRole ? senderRole.color : '#475569',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                >
                  {senderRole ? senderRole.emoji : '我'}
                </AvatarFallback>
              </Avatar>
              <div className={`max-w-[70%] ${isSelf ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                  <span>{isSelf ? '我' : (senderRole?.name || msg.sender_id)}</span>
                  <span>{new Date(msg.created_at).toLocaleTimeString('zh-CN', { hour12: false })}</span>
                  {Number(msg.is_broadcast) > 0 && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3">群发</Badge>
                  )}
                </div>
                <div
                  className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${isSelf
                      ? 'bg-sky-500/20 text-sky-100 rounded-tr-sm'
                      : 'bg-white/5 text-slate-100 rounded-tl-sm'
                    }`}
                  style={!isSelf && senderRole ? { borderLeft: `2px solid ${senderRole.color}` } : undefined}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function MessageComposer({
  onSend, disabled,
}: {
  onSend: (content: string) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState('');
  const submit = () => {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText('');
  };
  return (
    <div className="p-3 border-t border-white/5 flex gap-2">
      <Input
        placeholder={disabled ? '请先选择对话对象' : '输入消息... (Enter 发送)'}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
        disabled={disabled}
        className="bg-white/5 border-white/10 text-sm"
      />
      <Button onClick={submit} disabled={disabled || !text.trim()} size="sm">
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}
