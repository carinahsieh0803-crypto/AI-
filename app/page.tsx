"use client";

import { type FormEvent, type ReactNode, useMemo, useState, useSyncExternalStore } from "react";
import { hasTimeConflict, isValidTimeRange } from "@/lib/schedules";

type Category = {
  id: string;
  name: string;
  color: string;
  softColor: string;
};

type ScheduleItem = {
  id: string;
  title: string;
  category: string;
  day: number;
  start: number;
  end: number;
  group?: boolean;
  masked?: boolean;
};

type Proposal = Omit<ScheduleItem, "id">;
type ModalName = "event" | "category" | "group" | null;

const initialCategories: Category[] = [
  { id: "study", name: "學習", color: "#5577ec", softColor: "#edf0ff" },
  { id: "work", name: "工作", color: "#cf8a2e", softColor: "#fff3df" },
  { id: "fun", name: "娛樂", color: "#48a77a", softColor: "#e5f5ec" },
];

const initialItems: ScheduleItem[] = [
  { id: "s1", title: "晨間閱讀", category: "學習", day: 0, start: 9, end: 10 },
  { id: "s2", title: "產品週會", category: "工作", day: 0, start: 11, end: 12.5 },
  { id: "s3", title: "整理本週待辦", category: "工作", day: 1, start: 10, end: 11 },
  { id: "s4", title: "線上課程：設計思考", category: "學習", day: 1, start: 13, end: 14.5 },
  { id: "s5", title: "專案進度討論", category: "工作", day: 2, start: 9, end: 10 },
  { id: "s6", title: "午餐與散步", category: "娛樂", day: 2, start: 12, end: 13 },
  { id: "s7", title: "閱讀時間", category: "學習", day: 3, start: 14, end: 15 },
  { id: "s8", title: "瑜伽課", category: "運動", day: 4, start: 17, end: 18 },
  { id: "g1", title: "設計小組例會", category: "小組行程", day: 1, start: 16, end: 17, group: true },
  { id: "g2", title: "週末咖啡聚會", category: "小組行程", day: 4, start: 15, end: 16, group: true },
  { id: "b1", title: "忙碌中", category: "忙碌中", day: 0, start: 14, end: 16, masked: true },
  { id: "b2", title: "忙碌中", category: "忙碌中", day: 2, start: 15, end: 16.5, masked: true },
  { id: "b3", title: "忙碌中", category: "忙碌中", day: 3, start: 10, end: 12, masked: true },
];

const weekdays = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];
const hours = Array.from({ length: 13 }, (_, index) => index + 8);
const palette = ["#5577ec", "#cf8a2e", "#48a77a", "#b16bd4", "#e36c83", "#4c9caa"];

function Icon({
  name,
  size = 18,
}: {
  name: "calendar" | "users" | "settings" | "plus" | "chevron" | "sparkles" | "check" | "close" | "clock" | "search" | "bell" | "arrow" | "dots" | "filter" | "copy" | "sun" | "menu";
  size?: number;
}) {
  const paths: Record<typeof name, ReactNode> = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    sparkles: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" /><path d="m5 15 .7 1.3L7 17l-1.3.7L5 19l-.7-1.3L3 17l1.3-.7L5 15Z" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    dots: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    filter: <><path d="M4 6h16M7 12h10M10 18h4" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  };
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function mondayOf(date: Date) {
  const result = new Date(date);
  const day = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

function dateLabel(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getTodayKey() {
  return dateKey(new Date());
}

function subscribeToClock(onChange: () => void) {
  const interval = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(interval);
}

function itemColor(item: ScheduleItem, categories: Category[]) {
  if (item.masked) return { color: "#8a8e98", softColor: "#f0f1f3" };
  if (item.group) return { color: "#a476c6", softColor: "#f4ebfa" };
  return categories.find((category) => category.name === item.category) ?? {
    color: "#5577ec",
    softColor: "#edf0ff",
  };
}

export default function Home() {
  const [mode, setMode] = useState<"personal" | "group">("personal");
  const [activeGroup, setActiveGroup] = useState("週末探險隊");
  const [groups, setGroups] = useState(["週末探險隊", "產品設計小組"]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [categories, setCategories] = useState(initialCategories);
  const [visibleCategories, setVisibleCategories] = useState<string[]>(initialCategories.map((item) => item.name).concat("運動"));
  const [items, setItems] = useState(initialItems);
  const [modal, setModal] = useState<ModalName>(null);
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [proposal, setProposal] = useState<Proposal[] | null>(null);
  const [toast, setToast] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventCategory, setEventCategory] = useState("學習");
  const [eventDay, setEventDay] = useState("0");
  const [eventStart, setEventStart] = useState("09:00");
  const [eventEnd, setEventEnd] = useState("10:00");
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState(palette[3]);
  const [groupName, setGroupName] = useState("");

  const todayKey = useSyncExternalStore(subscribeToClock, getTodayKey, () => "2026-11-16");

  const weekStart = useMemo(() => {
    const [year, month, day] = todayKey.split("-").map(Number);
    const date = mondayOf(new Date(year, month - 1, day));
    date.setDate(date.getDate() + weekOffset * 7);
    return date;
  }, [todayKey, weekOffset]);
  const dates = useMemo(() => weekdays.map((_, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    return date;
  }), [weekStart]);
  const visibleItems = items.filter((item) => {
    if (mode === "group") return item.group || item.masked;
    return !item.group && !item.masked && visibleCategories.includes(item.category);
  });

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function toggleCategory(name: string) {
    setVisibleCategories((current) => current.includes(name)
      ? current.filter((category) => category !== name)
      : [...current, name]);
  }

  function saveEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = eventTitle.trim();
    const [startHour, startMinute] = eventStart.split(":").map(Number);
    const [endHour, endMinute] = eventEnd.split(":").map(Number);
    const start = startHour + startMinute / 60;
    const end = endHour + endMinute / 60;
    if (!title) {
      showToast("請輸入標題");
      return;
    }
    if (!isValidTimeRange({ start, end })) {
      showToast("結束時間必須晚於開始時間");
      return;
    }
    const selectedDay = Number(eventDay);
    const conflictingItems = items
      .filter((item) => item.day === selectedDay
        && (mode === "group" ? item.group : !item.group && !item.masked))
      .map(({ start: itemStart, end: itemEnd }) => ({ start: itemStart, end: itemEnd }));
    const conflict = hasTimeConflict({ start, end }, conflictingItems);
    if (conflict) {
      showToast("這個時段已有行程，請調整時間");
      return;
    }
    setItems((current) => [...current, {
      id: `event-${Date.now()}`,
      title,
      category: mode === "group" ? "小組行程" : eventCategory,
      day: selectedDay,
      start,
      end,
      group: mode === "group",
    }]);
    setEventTitle("");
    setModal(null);
    showToast(mode === "group" ? "小組行程已新增並同步" : "行程已新增");
  }

  function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = categoryName.trim();
    if (!name) {
      showToast("請輸入類別名稱");
      return;
    }
    if (categories.some((category) => category.name === name) || ["運動"].includes(name)) {
      showToast("類別名稱已存在");
      return;
    }
    const newCategory = { id: `custom-${Date.now()}`, name, color: categoryColor, softColor: `${categoryColor}1c` };
    setCategories((current) => [...current, newCategory]);
    setVisibleCategories((current) => [...current, name]);
    setEventCategory(name);
    setCategoryName("");
    setModal(null);
    showToast("新類別已加入");
  }

  function createGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = groupName.trim();
    if (!name) {
      showToast("請輸入小組名稱");
      return;
    }
    setGroups((current) => [...current, name]);
    setActiveGroup(name);
    setGroupName("");
    setModal(null);
    setMode("group");
    showToast("小組已建立，邀請連結已準備好");
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => [...current, text]);
    setDraft("");
    if (/你好|嗨|早安|晚安/.test(text) || text.length < 9) {
      setMessages((current) => [...current, "請告訴我想安排的任務、日期與大約時長，我才能幫你整理成排程提案。"]);
      setProposal(null);
      return;
    }
    const proposals: Proposal[] = mode === "group"
      ? [{ title: "小組專題討論", category: "小組行程", day: 3, start: 19, end: 21, group: true }]
      : [
        { title: "複習微積分", category: "學習", day: 2, start: 15, end: 17 },
        { title: "放鬆打電動", category: "娛樂", day: 2, start: 20, end: 21 },
      ];
    setProposal(proposals);
    setMessages((current) => [...current, "我整理了一份排程提案，確認前不會新增到行事曆。"]);
  }

  function confirmProposal() {
    if (!proposal) return;
    const hasConflict = proposal.some((suggestion) => hasTimeConflict(
      { start: suggestion.start, end: suggestion.end },
      items.filter((item) => item.day === suggestion.day
        && (suggestion.group ? item.group : !item.group && !item.masked))
        .map(({ start, end }) => ({ start, end })),
    ));
    if (hasConflict) {
      showToast("提案時段已有新行程，請重新調整");
      setProposal(null);
      return;
    }
    setItems((current) => [...current, ...proposal.map((item) => ({ ...item, id: `proposal-${Date.now()}-${item.day}-${item.start}` }))]);
    setProposal(null);
    showToast("排程提案已確認並加入行事曆");
  }

  function copyInvite() {
    const inviteCode = `plan.tw/invite/${activeGroup.replace(/\s/g, "").slice(0, 6).toLowerCase() || "weekend"}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteCode).then(
        () => showToast("邀請連結已複製"),
        () => showToast(`邀請連結：${inviteCode}`),
      );
    } else {
      showToast(`邀請連結：${inviteCode}`);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="日日首頁">
          <span className="brand-mark"><Icon name="sun" size={20} /></span>
          <span>日日<span className="brand-period">.</span></span>
        </a>
        <div className="workspace-label">工作空間</div>
        <nav className="main-nav" aria-label="主要導覽">
          <button className={`nav-item ${mode === "personal" ? "selected" : ""}`} onClick={() => setMode("personal")}>
            <Icon name="calendar" /><span>個人行事曆</span>
          </button>
          <button className={`nav-item ${mode === "group" ? "selected" : ""}`} onClick={() => setMode("group")}>
            <Icon name="users" /><span>小組模式</span><span className="nav-count">{groups.length}</span>
          </button>
        </nav>

        {mode === "personal" ? (
          <section className="side-section">
            <div className="section-heading">
              <span>我的類別</span>
              <button className="icon-button subtle" onClick={() => setModal("category")} aria-label="新增類別"><Icon name="plus" size={16} /></button>
            </div>
            <div className="category-list">
              {categories.concat(visibleCategories.includes("運動") ? [{ id: "exercise", name: "運動", color: "#d16d85", softColor: "#fcecf0" }] : []).map((category) => (
                <label className="category-option" key={category.id}>
                  <input type="checkbox" checked={visibleCategories.includes(category.name)} onChange={() => toggleCategory(category.name)} />
                  <span className="category-dot" style={{ backgroundColor: category.color }} />
                  <span>{category.name}</span>
                  <span className="category-total">{items.filter((item) => item.category === category.name).length}</span>
                </label>
              ))}
            </div>
            <button className="add-category" onClick={() => setModal("category")}><Icon name="plus" size={15} />新增類別</button>
          </section>
        ) : (
          <section className="side-section">
            <div className="section-heading"><span>我的小組</span><button className="icon-button subtle" onClick={() => setModal("group")} aria-label="建立小組"><Icon name="plus" size={16} /></button></div>
            <div className="group-list">
              {groups.map((group, index) => (
                <button key={group} className={`group-option ${activeGroup === group ? "active" : ""}`} onClick={() => setActiveGroup(group)}>
                  <span className={`group-avatar avatar-${index % 3}`}>{group.slice(0, 1)}</span><span>{group}</span>
                  {activeGroup === group && <span className="group-current-dot" />}
                </button>
              ))}
              <button className="add-category" onClick={() => setModal("group")}><Icon name="plus" size={15} />建立小組</button>
            </div>
          </section>
        )}

        <div className="sidebar-spacer" />
        <div className="sidebar-tip">
          <span className="tip-icon"><Icon name="sparkles" size={17} /></span>
          <p>讓每一天，都有剛好的安排。</p>
        </div>
        <button className="profile-button">
          <span className="profile-avatar">林</span>
          <span className="profile-copy"><strong>林予晴</strong><small>個人規劃者</small></span>
          <Icon name="dots" size={18} />
        </button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="breadcrumb"><span>工作空間</span><Icon name="chevron" size={14} /><strong>{mode === "group" ? activeGroup : "個人行事曆"}</strong></div>
          <div className="topbar-actions">
            <span className="demo-badge"><span />展示模式</span>
            <button className="icon-button top-icon" aria-label="搜尋"><Icon name="search" /></button>
            <button className="icon-button top-icon notification-button" aria-label="通知"><Icon name="bell" /><i /></button>
            <span className="top-divider" />
            <button className="profile-avatar top-avatar" aria-label="個人設定">林</button>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">{mode === "group" ? "一起安排，剛剛好的相聚" : "把時間留給重要的事"}</div>
              <h1>{mode === "group" ? activeGroup : "我的行事曆"}<span className="heading-period">.</span></h1>
              <p>{mode === "group" ? "共享行程即時同步，個人私密時段已妥善隱藏。" : "早安，予晴。準備好迎接充實的一週了嗎？"}</p>
            </div>
            <div className="heading-buttons">
              {mode === "group" && <button className="button secondary" onClick={copyInvite}><Icon name="copy" size={16} />邀請成員</button>}
              <button className="button primary" onClick={() => setModal("event")}><Icon name="plus" size={17} />新增行程</button>
            </div>
          </div>

          <div className="calendar-toolbar">
            <div className="view-switch" aria-label="行事曆檢視">
              <button className="view-current">週</button><button onClick={() => showToast("月檢視即將推出")}>月</button>
            </div>
            <button className="today-button" onClick={() => setWeekOffset(0)}>今天</button>
            <div className="week-controls">
              <button className="icon-button" aria-label="上一週" onClick={() => setWeekOffset((offset) => offset - 1)}><svg className="flip-icon"><Icon name="chevron" size={17} /></svg></button>
              <button className="week-range" onClick={() => setWeekOffset(0)}>{dateLabel(dates[0])} — {dateLabel(dates[6])}</button>
              <button className="icon-button" aria-label="下一週" onClick={() => setWeekOffset((offset) => offset + 1)}><Icon name="chevron" size={17} /></button>
            </div>
            <div className="toolbar-spacer" />
            {mode === "group" && <button className="button quiet-button" onClick={() => showToast("目前沒有共同空檔")}><Icon name="filter" size={16} />檢視共同空檔</button>}
            <button className="icon-button toolbar-filter" aria-label="顯示篩選器" onClick={() => showToast("可使用左側類別篩選行程")}><Icon name="filter" size={17} /></button>
          </div>

          {mode === "group" && (
            <div className="privacy-banner"><span className="privacy-lock">✓</span><span><strong>隱私保護已開啟</strong>　成員的私人行程只會顯示為「忙碌中」</span><button onClick={() => showToast("小組成員的私人行程不會分享標題與類別")}>了解更多</button></div>
          )}

          <div className="calendar-card">
            <div className="calendar-scroll">
              <div className="calendar-grid">
                <div className="calendar-corner"><span>GMT+8</span></div>
                {dates.map((date, index) => (
                  <div className={`day-heading ${dateKey(date) === todayKey ? "is-today" : ""}`} key={weekdays[index]}>
                    <span>{weekdays[index]}</span><strong>{String(date.getDate()).padStart(2, "0")}</strong>
                    {dateKey(date) === todayKey && <i />}
                  </div>
                ))}
                <div className="time-column">
                  {hours.map((hour) => <div className="hour-label" key={hour}>{String(hour).padStart(2, "0")}:00</div>)}
                </div>
                {dates.map((date, dayIndex) => (
                  <div className="day-column" key={date.toISOString()}>
                    {hours.map((hour) => <div className="hour-cell" key={hour} />)}
                    {visibleItems.filter((item) => item.day === dayIndex).map((item) => {
                      const color = itemColor(item, categories);
                      return (
                        <button
                          key={item.id}
                          className={`event-card ${item.masked ? "masked-card" : ""} ${item.group ? "group-card" : ""}`}
                          style={{
                            top: `${(item.start - 8) * 66 + 2}px`,
                            height: `${Math.max((item.end - item.start) * 66 - 4, 36)}px`,
                            backgroundColor: color.softColor,
                            borderLeftColor: color.color,
                            color: item.masked ? "#747984" : "#33394a",
                          }}
                          onClick={() => item.masked ? showToast("為保護隱私，不會顯示這段行程的詳細資訊") : showToast(`${item.title}・${String(Math.floor(item.start)).padStart(2, "0")}:${item.start % 1 ? "30" : "00"}`)}
                        >
                          <span className="event-title">{item.title}</span>
                          <span className="event-time">{String(Math.floor(item.start)).padStart(2, "0")}:{item.start % 1 ? "30" : "00"} – {String(Math.floor(item.end)).padStart(2, "0")}:{item.end % 1 ? "30" : "00"}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="calendar-footnote"><span><i className="footnote-dot" />共 {visibleItems.length} 個行程</span><span>所有時間皆為台北時間</span></div>
          </div>

          <div className="below-calendar">
            <div className="upcoming-title"><span className="upcoming-icon"><Icon name="clock" size={16} /></span><strong>接下來</strong><span>本週值得期待的時刻</span></div>
            <div className="upcoming-items">
              {visibleItems.filter((item) => item.day >= 0).slice(0, 3).map((item) => (
                <div className="upcoming-item" key={`next-${item.id}`}><span className="upcoming-dot" style={{ backgroundColor: itemColor(item, categories).color }} /><span className="upcoming-name">{item.title}</span><span className="upcoming-date">{weekdays[item.day]}・{String(Math.floor(item.start)).padStart(2, "0")}:{item.start % 1 ? "30" : "00"}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {assistantOpen ? (
        <aside className="assistant-panel">
          <div className="assistant-head">
            <div className="assistant-title"><span className="assistant-mark"><Icon name="sparkles" size={19} /></span><div><strong>AI 管家</strong><small>你的時間規劃夥伴</small></div></div>
            <button className="icon-button subtle" onClick={() => setAssistantOpen(false)} aria-label="關閉 AI 管家"><Icon name="close" size={18} /></button>
          </div>
          <div className="assistant-content">
            <div className="assistant-welcome">
              <div className="welcome-sparkle"><Icon name="sparkles" size={21} /></div>
              <h2>嗨，予晴！<br />今天想安排些什麼？</h2>
              <p>告訴我你的計畫，我會整理成清楚的排程提案，等你確認後才加入行事曆。</p>
            </div>
            {messages.map((message, index) => <div className={index % 2 === 0 ? "chat-user" : "chat-assistant"} key={`${index}-${message}`}>{message}</div>)}
            {proposal && (
              <div className="proposal-card">
                <div className="proposal-heading"><span><Icon name="sparkles" size={16} />排程提案</span><button onClick={() => setProposal(null)} aria-label="取消提案"><Icon name="close" size={15} /></button></div>
                <p className="proposal-note">確認前不會新增行程</p>
                {proposal.map((item, index) => (
                  <div className="proposal-row" key={`${item.title}-${index}`}>
                    <span className="proposal-color" style={{ backgroundColor: itemColor({ ...item, id: "proposal" }, categories).color }} />
                    <div><strong>{item.title}</strong><small>{weekdays[item.day]}・{String(item.start).padStart(2, "0")}:00 – {String(item.end).padStart(2, "0")}:00</small></div>
                    <span className="proposal-category">{item.category}</span>
                  </div>
                ))}
                <div className="proposal-actions"><button className="proposal-cancel" onClick={() => setProposal(null)}>取消</button><button className="proposal-confirm" onClick={confirmProposal}><Icon name="check" size={15} />確認排程</button></div>
              </div>
            )}
            <div className="suggestions">
              <span>試試這樣問</span>
              <button onClick={() => setDraft("幫我這週三下午排 2 小時複習微積分，晚上排 1 小時打電動")}>安排本週學習與休息 <Icon name="arrow" size={14} /></button>
              <button onClick={() => setDraft("幫我找一個週三下午的時間，安排兩小時讀書")}>幫我找一段讀書時間 <Icon name="arrow" size={14} /></button>
            </div>
          </div>
          <form className="assistant-input-area" onSubmit={sendMessage}>
            <label className="sr-only" htmlFor="assistant-prompt">輸入排程需求</label>
            <textarea id="assistant-prompt" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="輸入你想安排的事情…" rows={2} onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }} />
            <div className="input-bottom"><span>Shift + Enter 換行</span><button type="submit" disabled={!draft.trim()} aria-label="送出訊息"><Icon name="arrow" size={17} /></button></div>
          </form>
          <div className="assistant-disclaimer">AI 提案僅供參考，確認後才會加入行事曆</div>
        </aside>
      ) : (
        <button className="assistant-fab" onClick={() => setAssistantOpen(true)}><Icon name="sparkles" size={18} />AI 管家</button>
      )}

      {modal && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-header">
              <div><div className="modal-eyebrow">{modal === "event" ? "留一段時間給自己" : modal === "category" ? "整理你的生活節奏" : "把朋友聚在一起"}</div><h2 id="modal-title">{modal === "event" ? "新增行程" : modal === "category" ? "新增類別" : "建立小組"}</h2></div>
              <button className="icon-button subtle" onClick={() => setModal(null)} aria-label="關閉"><Icon name="close" /></button>
            </div>
            {modal === "event" && (
              <form className="modal-form" onSubmit={saveEvent}>
                <label>行程標題<input autoFocus value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} placeholder="例如：準備設計提案" /></label>
                {mode === "personal" && <label>類別<select value={eventCategory} onChange={(event) => setEventCategory(event.target.value)}>{categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}<option value="運動">運動</option></select></label>}
                <label>日期<select value={eventDay} onChange={(event) => setEventDay(event.target.value)}>{dates.map((date, index) => <option value={index} key={date.toISOString()}>{weekdays[index]}・{dateLabel(date)}</option>)}</select></label>
                <div className="form-time-row"><label>開始時間<input type="time" value={eventStart} onChange={(event) => setEventStart(event.target.value)} /></label><label>結束時間<input type="time" value={eventEnd} onChange={(event) => setEventEnd(event.target.value)} /></label></div>
                <div className="modal-actions"><button type="button" className="button secondary" onClick={() => setModal(null)}>取消</button><button type="submit" className="button primary">儲存行程</button></div>
              </form>
            )}
            {modal === "category" && (
              <form className="modal-form" onSubmit={saveCategory}>
                <label>類別名稱<input autoFocus value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="例如：運動、社團" /></label>
                <div className="color-picker-label">選擇代表色彩</div>
                <div className="color-picker">{palette.map((color) => <button type="button" aria-label={`選擇色彩 ${color}`} aria-pressed={categoryColor === color} className={`color-choice ${categoryColor === color ? "color-selected" : ""}`} style={{ backgroundColor: color }} onClick={() => setCategoryColor(color)} key={color} />)}</div>
                <div className="modal-actions"><button type="button" className="button secondary" onClick={() => setModal(null)}>取消</button><button type="submit" className="button primary">儲存類別</button></div>
              </form>
            )}
            {modal === "group" && (
              <form className="modal-form" onSubmit={createGroup}>
                <p className="modal-description">建立小組後就能和朋友共享行程，一起找到適合大家的時間。</p>
                <label>小組名稱<input autoFocus value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="例如：週末登山夥伴" maxLength={32} /></label>
                <div className="modal-actions"><button type="button" className="button secondary" onClick={() => setModal(null)}>取消</button><button type="submit" className="button primary">建立小組</button></div>
              </form>
            )}
          </section>
        </div>
      )}

      {toast && <div role="status" className="toast"><span className="toast-check"><Icon name="check" size={14} /></span>{toast}</div>}
    </main>
  );
}
