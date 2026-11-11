import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Gift,
  History,
  Maximize,
  Plus,
  RotateCcw,
  Settings2,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  X,
  GraduationCap,
} from "lucide-react";
import {
  COLORS,
  DEFAULT_PRIZES,
  type Prize,
  type Draw,
  validatePrizes,
  pickWinner,
  randomInt,
  targetRotation,
  readSaved,
} from "./wheel";

import { LOGO } from "./generated-assets";

const STORAGE_KEY = "cnsu-lucky-spin-v1";
const SCHOOL_URL = "https://www.cnsu.ac.kr/univ/main.do";
function Wheel({
  prizes,
  rotation,
  duration,
  spinning,
}: {
  prizes: Prize[];
  rotation: number;
  duration: number;
  spinning: boolean;
}) {
  const step = 360 / prizes.length;
  const polar = (deg: number, radius: number) =>
    [
      250 + radius * Math.cos((deg * Math.PI) / 180),
      250 + radius * Math.sin((deg * Math.PI) / 180),
    ].map((value) => Number(value.toFixed(4)));
  return (
    <div className={`wheel-wrap ${spinning ? "is-spinning" : ""}`}>
      <div className="wheel-shadow" />
      <svg className="wheel-frame" viewBox="0 0 500 500" aria-hidden="true">
        <circle cx="250" cy="250" r="244" fill="#10285c" />
        <circle
          cx="250"
          cy="250"
          r="237"
          fill="#f8fbff"
          stroke="#b9d0ed"
          strokeWidth="1"
        />
        {Array.from({ length: 36 }, (_, i) => {
          const [x, y] = polar(i * 10, 231);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3.1"
              fill={i % 2 ? "#c9daf7" : "#ffffff"}
            />
          );
        })}
      </svg>
      <svg
        className="wheel-disc"
        viewBox="0 0 500 500"
        role="img"
        aria-label={`돌림판: ${prizes.map((p) => `${p.name} ${p.probability}%`).join(", ")}`}
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: `transform ${duration}ms cubic-bezier(.12,.7,.12,1)`,
        }}
      >
        {prizes.map((p, i) => {
          const start = i * step - 90,
            end = (i + 1) * step - 90,
            middle = (start + end) / 2;
          const [sx, sy] = polar(start, 218),
            [ex, ey] = polar(end, 218),
            [tx, ty] = polar(middle, prizes.length > 8 ? 150 : 140);
          const angle = middle > 90 && middle < 270 ? middle + 180 : middle;
          const label = p.name.length > 10 ? p.name.slice(0, 9) + "…" : p.name;
          return (
            <g key={p.id}>
              <path
                d={`M250,250 L${sx},${sy} A218,218 0 ${step > 180 ? 1 : 0},1 ${ex},${ey} Z`}
                fill={p.color}
                stroke="#ffffff"
                strokeWidth="2"
              />
              <g
                transform={`translate(${tx} ${ty}) rotate(${angle})`}
                fill="#10285c"
              >
                <text
                  textAnchor="middle"
                  y="-3"
                  fontSize={prizes.length > 8 ? 13 : 17}
                  fontWeight="750"
                >
                  {label}
                </text>
                <text
                  textAnchor="middle"
                  y="20"
                  fontSize="12"
                  opacity=".74"
                  fontWeight="600"
                >
                  {p.probability}%
                </text>
              </g>
            </g>
          );
        })}
      </svg>
      <div className="wheel-hub">
        <GraduationCap size={22} strokeWidth={1.6} />
        <span>CNSU</span>
        <small>LUCKY SPIN</small>
      </div>
      <div className="wheel-pointer">
        <span />
      </div>
      <span className="floating-star star-one">✦</span>
      <span className="floating-star star-two">✧</span>
      <span className="floating-star star-three">✦</span>
    </div>
  );
}
export default function Home() {
  const [prizes, setPrizes] = useState<Prize[]>(DEFAULT_PRIZES),
    [draft, setDraft] = useState<Prize[]>(DEFAULT_PRIZES);
  const [title, setTitle] = useState("충남도립대 럭키 스핀"),
    [draftTitle, setDraftTitle] = useState("충남도립대 럭키 스핀");
  const [history, setHistory] = useState<Draw[]>([]),
    [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<"settings" | "history">("settings"),
    [rotation, setRotation] = useState(0),
    [duration, setDuration] = useState(4800);
  const [spinning, setSpinning] = useState(false),
    [winner, setWinner] = useState<Draw | null>(null);
  const [sound, setSound] = useState(false),
    [presenting, setPresenting] = useState(false),
    [notice, setNotice] = useState("");
  const [inputError, setInputError] = useState(""),
    [storageError, setStorageError] = useState(false),
    [clearConfirm, setClearConfirm] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null),
    spinButton = useRef<HTMLButtonElement>(null),
    spinLock = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    audio = useRef<AudioContext | null>(null);
  const valid = validatePrizes(draft),
    total = draft.reduce(
      (sum, p) => sum + (p.probability === "" ? 0 : Number(p.probability)),
      0,
    );
  const dirty =
    JSON.stringify(draft) !== JSON.stringify(prizes) || draftTitle !== title;
  const canSpin =
    loaded && !dirty && !spinning && !winner && !validatePrizes(prizes);
  useEffect(() => {
    try {
      const saved = readSaved(localStorage.getItem(STORAGE_KEY));
      if (saved) {
        setPrizes(saved.prizes);
        setDraft(saved.prizes);
        setTitle(saved.title);
        setDraftTitle(saved.title);
        setHistory(saved.history);
      }
    } catch {
      setStorageError(true);
    }
    setLoaded(true);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      audio.current?.close();
    };
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ prizes, title, history }),
      );
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [prizes, title, history, loaded]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    if (winner) dialog.current?.showModal();
    else dialog.current?.close();
  }, [winner]);
  useEffect(() => {
    const change = () => {
      if (!document.fullscreenElement) setPresenting(false);
    };
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (
        e.code === "Space" &&
        !["INPUT", "BUTTON", "TEXTAREA", "SELECT"].includes(el.tagName) &&
        !el.isContentEditable &&
        canSpin
      ) {
        e.preventDefault();
        spin();
      }
      if (e.key === "Escape" && !document.fullscreenElement) {
        setPresenting(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });
  function chime() {
    if (!sound || !audio.current) return;
    const ctx = audio.current;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator(),
        gain = ctx.createGain(),
        start = ctx.currentTime + i * 0.13;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.1, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.45);
    });
  }
  function spin() {
    if (!canSpin || spinLock.current) return;
    spinLock.current = true;
    if (sound) {
      try {
        audio.current ??= new AudioContext();
        void audio.current.resume().catch(() => {});
      } catch {
        /* Optional sound. */
      }
    }
    const index = pickWinner(prizes, randomInt(100)),
      p = prizes[index],
      ms = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 200
        : 4800;
    const result = {
      id: crypto.randomUUID(),
      name: p.name,
      color: p.color,
      probability: Number(p.probability),
      at: new Date().toISOString(),
    };
    setDuration(ms);
    setSpinning(true);
    setRotation(
      targetRotation(rotation, index, prizes.length, 0.2 + randomInt(61) / 100),
    );
    timer.current = setTimeout(() => {
      setWinner(result);
      setHistory((h) => [result, ...h].slice(0, 100));
      setSpinning(false);
      spinLock.current = false;
      chime();
    }, ms + 80);
  }
  function updatePrize(
    id: string,
    field: "name" | "probability",
    value: string,
  ) {
    if (field === "probability") {
      if (!/^\d{0,3}$/.test(value) || Number(value) > 100) {
        setInputError("확률은 소수점 없이 0~100 사이의 정수로 입력해 주세요.");
        return;
      }
      setInputError("");
    }
    setDraft((d) => d.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }
  function applySettings() {
    if (valid || !draftTitle.trim() || spinning) return;
    const next = draft.map((p) => ({
      ...p,
      name: p.name.trim(),
      probability: Number(p.probability),
    }));
    setPrizes(next);
    setDraft(next);
    setTitle(draftTitle.trim());
    setDraftTitle(draftTitle.trim());
    setRotation(0);
    setDuration(0);
    setInputError("");
    setNotice("설정이 적용되었어요. 이제 돌림판을 돌려보세요!");
  }
  function distribute() {
    setDraft((d) =>
      d.map((p, i) => ({
        ...p,
        probability: Math.floor(100 / d.length) + (i < 100 % d.length ? 1 : 0),
      })),
    );
    setInputError("");
  }
  async function presentation() {
    if (presenting) {
      setPresenting(false);
      if (document.fullscreenElement)
        await document.exitFullscreen().catch(() => {});
      return;
    }
    setPresenting(true);
    if (document.documentElement.requestFullscreen)
      await document.documentElement.requestFullscreen().catch(() => {
        setNotice(
          "진행 모드로 전환했어요. 브라우저 전체화면도 사용할 수 있어요.",
        );
      });
  }
  function closeResult() {
    setWinner(null);
    setTimeout(() => spinButton.current?.focus(), 0);
  }
  function downloadHistory() {
    const quote = (s: string) =>
      '"' + (/^[=+\-@\t\r]/.test(s) ? "'" : "") + s.replace(/"/g, '""') + '"';
    const rows = [
      ["추첨 시각", "경품", "설정 확률(%)"],
      ...history.map((d) => [
        new Date(d.at).toLocaleString("ko-KR"),
        d.name,
        String(d.probability),
      ]),
    ];
    const blob = new Blob(
      ["\uFEFF" + rows.map((row) => row.map(quote).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "CNSU-추첨기록.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className={`app ${presenting ? "presenting" : ""}`}>
      <header className="topbar">
        <a
          className="brand"
          href={SCHOOL_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="충남도립대학교 홈페이지"
        >
          <img
            src={LOGO}
            alt="충남도립대학교 CHUNGNAM STATE UNIVERSITY"
            width="212"
            height="53"
          />
        </a>
        <span className="header-tag">
          CAMPUS EVENT <span>함께 만드는 특별한 순간</span>
        </span>
        <div className="header-actions">
          <button
            className={`icon-button sound-button ${sound ? "active" : ""}`}
            onClick={() => setSound(!sound)}
            aria-label={sound ? "효과음 끄기" : "효과음 켜기"}
            title={sound ? "효과음 끄기" : "효과음 켜기"}
          >
            {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
          <button className="outline-button" onClick={presentation}>
            {presenting ? <ArrowLeft size={16} /> : <Maximize size={16} />}
            {presenting ? "설정으로 돌아가기" : "행사 진행 모드"}
          </button>
        </div>
      </header>
      <main>
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span /> CHUNGNAM STATE UNIVERSITY
            </div>
            <h1>
              오늘의 행운, <span>충남도립대에서!</span>
              <span className="heading-spark">✦</span>
            </h1>
            <p>
              새로운 만남에 설렘을 더하다. 충남도립대학교와 함께하는 럭키 스핀.
            </p>
          </div>
        </div>
        <div className="workspace">
          <section className="stage" aria-label="이벤트 돌림판">
            <div className="stage-top">
              <span className="stage-label">
                <span className="status-dot" />
                {spinning ? "행운을 고르는 중" : "READY TO SPIN"}
              </span>
              <span className="round-count">
                {history.length > 0
                  ? `최근 ${history.length}회 추첨`
                  : "YOUR NEXT CHAPTER"}
              </span>
            </div>
            <h2>{title}</h2>
            <p className="stage-subtitle">당신의 새로운 시작을 응원합니다!</p>
            <Wheel
              prizes={prizes}
              rotation={rotation}
              duration={duration}
              spinning={spinning}
            />
            <button
              ref={spinButton}
              className="spin-button"
              onClick={spin}
              disabled={!canSpin}
            >
              <Sparkles size={21} />
              {spinning ? "행운을 찾고 있어요…" : "돌림판 돌리기"}
              {!spinning && <ArrowUpRight size={22} />}
            </button>
            <p
              className={`spin-hint ${dirty ? "needs-apply" : ""}`}
              aria-live="polite"
            >
              {spinning ? (
                "돌림판이 멈출 때까지 잠시 기다려 주세요"
              ) : dirty ? (
                "변경한 설정을 먼저 적용해 주세요"
              ) : (
                <>
                  버튼을 누르거나 <kbd>Space</kbd> 키로 시작하세요
                </>
              )}
            </p>
            <div className="stage-bottom">
              <span>
                <span className="tiny-dot" /> 설정 확률에 따른 무작위 추첨
              </span>
              <span>모든 칸은 같은 크기로 표시됩니다</span>
            </div>
          </section>
          <aside className="settings-panel">
            <div className="tabs" role="tablist" aria-label="돌림판 관리">
              <button
                role="tab"
                aria-selected={tab === "settings"}
                onClick={() => setTab("settings")}
              >
                <Settings2 size={17} /> 경품 설정
              </button>
              <button
                role="tab"
                aria-selected={tab === "history"}
                onClick={() => setTab("history")}
              >
                <History size={17} /> 추첨 기록{" "}
                {history.length > 0 && (
                  <span className="count-badge">{history.length}</span>
                )}
              </button>
            </div>
            {tab === "settings" ? (
              <div
                className="settings-body"
                role="tabpanel"
                aria-label="경품 설정"
              >
                <div className="panel-heading">
                  <div>
                    <h2>우리 행사에 맞게 설정해요</h2>
                    <p>이벤트에 맞게 경품과 확률을 설정하세요.</p>
                  </div>
                  <span className="little-gift">
                    <Gift size={21} />
                  </span>
                </div>
                <fieldset disabled={spinning || !loaded}>
                  <label className="field-label" htmlFor="event-title">
                    이벤트 이름
                  </label>
                  <input
                    id="event-title"
                    className="title-input"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    maxLength={40}
                    placeholder="이벤트 이름을 입력하세요"
                  />
                  <div className="list-title">
                    <span>
                      경품 목록 <b>{draft.length}</b>
                    </span>
                    <button
                      onClick={distribute}
                      className="text-button"
                      title="합계 100%가 되도록 정수로 배분"
                    >
                      균등 배분 <RotateCcw size={12} />
                    </button>
                  </div>
                  <div className="list-columns">
                    <span>경품 이름</span>
                    <span>당첨 확률</span>
                    <span />
                  </div>
                  <div className="prize-list">
                    {draft.map((p, i) => (
                      <div className="prize-row" key={p.id}>
                        <div className="prize-name">
                          <span
                            className="color-dot"
                            style={{ background: p.color }}
                          />
                          <input
                            aria-label={`경품 ${i + 1} 이름`}
                            value={p.name}
                            maxLength={24}
                            onChange={(e) =>
                              updatePrize(p.id, "name", e.target.value)
                            }
                            placeholder="경품 이름"
                          />
                        </div>
                        <div className="probability-input">
                          <input
                            aria-label={`경품 ${i + 1} 확률`}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={p.probability}
                            onChange={(e) =>
                              updatePrize(p.id, "probability", e.target.value)
                            }
                          />
                          <span>%</span>
                        </div>
                        <button
                          className="remove-button"
                          aria-label={`경품 ${i + 1} 삭제`}
                          disabled={draft.length <= 2}
                          onClick={() => {
                            setDraft((d) => d.filter((v) => v.id !== p.id));
                            setInputError("");
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    className="add-button"
                    disabled={draft.length >= 12}
                    onClick={() =>
                      setDraft((d) => [
                        ...d,
                        {
                          id: crypto.randomUUID(),
                          name: "",
                          probability: 0,
                          color: COLORS[d.length % COLORS.length],
                        },
                      ])
                    }
                  >
                    <Plus size={16} />
                    {draft.length >= 12
                      ? "최대 12개까지 설정할 수 있어요"
                      : "경품 추가"}
                  </button>
                  <div
                    className={`probability-summary ${valid ? "invalid" : ""}`}
                  >
                    <div>
                      <span>확률 합계</span>
                      <strong>
                        {total}
                        <small> / 100%</small>
                      </strong>
                    </div>
                    <div className="probability-track">
                      {draft.map((p) => (
                        <span
                          key={p.id}
                          style={{
                            width: `${Math.max(0, Number(p.probability))}%`,
                            background: p.color,
                          }}
                        />
                      ))}
                    </div>
                    <p aria-live="polite">
                      {inputError ? (
                        <span className="input-error">{inputError}</span>
                      ) : valid ? (
                        valid
                      ) : (
                        <>
                          <Check size={13} /> 딱 좋아요! 추첨을 시작할 수
                          있어요.
                        </>
                      )}
                    </p>
                  </div>
                  <div className="settings-note">
                    <span>0~100%의 정수만 입력할 수 있어요.</span>
                    <span>0% 경품은 당첨 대상에서 제외됩니다.</span>
                  </div>
                  <button
                    className="apply-button"
                    onClick={applySettings}
                    disabled={!!valid || !draftTitle.trim() || !dirty}
                  >
                    <Check size={17} />
                    {spinning
                      ? "추첨이 끝나면 수정할 수 있어요"
                      : dirty
                        ? "설정 적용"
                        : "설정 적용 완료"}
                  </button>
                </fieldset>
                <p className="save-note">
                  <span className={storageError ? "warning-dot" : "tiny-dot"} />
                  {storageError
                    ? "저장이 제한되어 종료하면 설정이 초기화될 수 있어요"
                    : dirty
                      ? "적용하지 않은 변경사항이 있어요"
                      : "설정은 이 기기에 자동으로 저장됩니다"}
                </p>
              </div>
            ) : (
              <div
                className="history-body"
                role="tabpanel"
                aria-label="추첨 기록"
              >
                <div className="panel-heading">
                  <div>
                    <h2>행운의 순간들</h2>
                    <p>이 기기에 저장된 최근 100회 기록입니다.</p>
                  </div>
                  <span className="little-gift">
                    <History size={21} />
                  </span>
                </div>
                {history.length ? (
                  <>
                    <div className="history-actions">
                      <button className="text-button" onClick={downloadHistory}>
                        <ArrowDownToLine size={14} /> CSV 다운로드
                      </button>
                      <button
                        className="text-button"
                        disabled={spinning}
                        onClick={() => setClearConfirm(true)}
                      >
                        <Trash2 size={13} /> 비우기
                      </button>
                    </div>
                    {clearConfirm && (
                      <div className="clear-confirm">
                        <p>추첨 기록을 모두 지울까요?</p>
                        <button
                          onClick={() => {
                            setHistory([]);
                            setClearConfirm(false);
                            setNotice("추첨 기록을 비웠어요.");
                          }}
                          disabled={spinning}
                        >
                          기록 삭제
                        </button>
                        <button onClick={() => setClearConfirm(false)}>
                          취소
                        </button>
                      </div>
                    )}
                    <ol className="history-list">
                      {history.map((d, i) => (
                        <li key={d.id}>
                          <span
                            className="history-gift"
                            style={{ background: d.color }}
                          >
                            <Gift size={17} />
                          </span>
                          <div>
                            <strong>{d.name}</strong>
                            <span>
                              {new Date(d.at).toLocaleString("ko-KR", {
                                month: "numeric",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </span>
                          </div>
                          <span className="history-order">
                            {i === 0 ? "최근" : `#${history.length - i}`}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </>
                ) : (
                  <div className="history-empty">
                    <Gift size={36} strokeWidth={1} />
                    <h3>첫 번째 행운을 기다리는 중</h3>
                    <p>
                      돌림판을 돌리면 당첨 기록이
                      <br />
                      이곳에 차곡차곡 쌓여요.
                    </p>
                    <button
                      className="text-button"
                      onClick={() => setTab("settings")}
                    >
                      경품 설정으로 <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
        <footer>
          <span>
            CNSU LUCKY SPIN <b>v1.0.2</b>
          </span>
          <p>충남도립대학교 홍보 행사용 돌림판</p>
          <span>
            <span className="tiny-dot" /> 인터넷 없이도 추첨할 수 있어요
          </span>
        </footer>
      </main>
      {notice && (
        <div className="toast" role="status">
          <Check size={16} />
          {notice}
        </div>
      )}
      <dialog
        ref={dialog}
        className="result-dialog"
        onCancel={closeResult}
        onClick={(e) => {
          if (e.target === dialog.current) closeResult();
        }}
        aria-labelledby="result-title"
      >
        {winner && (
          <>
            <div className="confetti" aria-hidden="true">
              {Array.from({ length: 36 }, (_, i) => (
                <i
                  key={i}
                  style={{
                    left: `${(i * 29) % 100}%`,
                    background: COLORS[i % COLORS.length],
                    animationDelay: `${(i % 7) * 0.12}s`,
                    transform: `rotate(${i * 23}deg)`,
                  }}
                />
              ))}
            </div>
            <button
              className="icon-button result-close"
              aria-label="결과 닫기"
              onClick={closeResult}
            >
              <X size={20} />
            </button>
            <div className="result-icon" style={{ background: winner.color }}>
              <Gift size={40} strokeWidth={1.5} />
            </div>
            <span className="eyebrow">CNSU · A GIFT FOR YOUR NEXT CHAPTER</span>
            <h2 id="result-title">행운이 도착했어요!</h2>
            <p className="winner-name">{winner.name}</p>
            <p className="result-copy">
              충남도립대학교와 함께한 행운의 순간.
              <br />
              충남도립대학교가 당신의 시작을 응원합니다.
            </p>
            <button className="apply-button" onClick={closeResult} autoFocus>
              확인하고 계속하기 <ChevronRight size={17} />
            </button>
          </>
        )}
      </dialog>
    </div>
  );
}
