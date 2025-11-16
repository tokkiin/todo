// デフォルトのダミー時刻表（適用されるまで使う）
let timetable = [
  { 時刻: "05:46", 種別: "普通", 行先: "大阪", のりば: "1" },
  { 時刻: "10:46", 種別: "普通", 行先: "大阪", のりば: "1" },
  { 時刻: "15:46", 種別: "普通", 行先: "大阪", のりば: "1" },
  { 時刻: "19:46", 種別: "普通", 行先: "大阪", のりば: "1" },
  { 時刻: "20:03", 種別: "快速", 行先: "おふろ", のりば: "1" },
  { 時刻: "23:18", 種別: "寝台特急", 行先: "ふとん", のりば: "1" },
  { 時刻: "05:08", 種別: "通勤快速", 行先: "職場", のりば: "1" },
];

function updateDepartureInfo() {
  // 現在の時刻を取得
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = `${hours}:${minutes < 10 ? "0" : ""}${minutes}`;

  // 直近の電車の情報を取得
  let nextDepartures = [];
  if (Array.isArray(timetable) && timetable.length > 0) {
    const currentTimeNum = `${hours}${minutes < 10 ? "0" : ""}${minutes}`;
    nextDepartures = timetable
      .filter((departure) => {
        let departureTime = departure.時刻.replace(":", "");
        let currentTimeNum = `${hours}${minutes < 10 ? "0" : ""}${minutes}`;

        if (departureTime < 900 && hours >= 12) {
          departureTime = parseInt(departureTime) + 2400;
        }
        return parseInt(departureTime) > parseInt(currentTimeNum);
      })
      .slice(0, 4);
  }

  // HTML要素に表示
  let announcement = "";
  if (nextDepartures.length > 0) {
    // 次発の時刻との差分を分単位で計算して案内を決定する
    const nextTimeStr = nextDepartures[0].時刻;
    const parts = String(nextTimeStr).split(":").map((p) => parseInt(p, 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const nowDate = new Date();
      let nextDate = new Date(
        nowDate.getFullYear(),
        nowDate.getMonth(),
        nowDate.getDate(),
        parts[0],
        parts[1],
        0,
        0
      );
      // 同日かつ既に過ぎている場合は翌日扱いにする
      if (nextDate.getTime() <= nowDate.getTime()) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      const diffMinutes = Math.round((nextDate.getTime() - nowDate.getTime()) / 60000);

      if (diffMinutes >= 10) {
        announcement = "出発まで余裕があります";
      } else if (diffMinutes >= 5) {
        announcement = "そろそろ準備してください";
      } else {
        announcement = "急いでください";
      }
    } else {
      announcement = "案内情報がありません";
    }

    const annEl = document.getElementById("announcement");
    if (annEl) annEl.textContent = announcement;
  }

  for (let i = 0; i < 4; i++) {
    const departure = nextDepartures[i];
    const timeId = `time${i === 0 ? "" : i + 1}`;
    const typeId = `type${i === 0 ? "" : i + 1}`;
    const destinationId = `destination${i === 0 ? "" : i + 1}`;
    const platformId = `platform${i === 0 ? "" : i + 1}`;

    if (departure) {
      document.getElementById(timeId).textContent = departure.時刻;
      const typeElement = document.getElementById(typeId);
      typeElement.textContent = departure.種別;
      if (departure.種別.includes("普通")) {
        typeElement.className = "type type-normal";
      } else if (
        departure.種別.includes("快速") ||
        departure.種別.includes("急行")
      ) {
        typeElement.className = "type type-rapid";
      } else if (departure.種別.includes("特急")) {
        typeElement.className = "type type-limitedexpress";
      } else {
        typeElement.className = "type";
      }
      document.getElementById(destinationId).textContent = departure.行先;
      document.getElementById(platformId).textContent = departure.のりば;
    } else {
      document.getElementById(timeId).textContent = "--:--";
      document.getElementById(typeId).textContent = "--";
      document.getElementById(destinationId).textContent = "--";
      document.getElementById(platformId).textContent = "--";
    }
  }
}

// 1分ごとに情報を更新
setInterval(updateDepartureInfo, 60000);

// 初回実行
updateDepartureInfo();

// 現在時刻を hh:mm で表示する機能
function pad2(n) {
  return n < 10 ? "0" + n : String(n);
}

function updateClock() {
  const now = new Date();
  const hh = pad2(now.getHours());
  const mm = pad2(now.getMinutes());
  const el = document.getElementById("current-time");
  if (el) el.textContent = `${hh}:${mm}`;
}

// 毎秒チェックして分が変わったら表示を更新（秒表示は不要なので hh:mm のまま）
setInterval(updateClock, 1000);
updateClock();

// CSV をパースして時刻表配列に変換する
function parseTimetableCsv(text) {
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const rows = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cols = line.split(",").map((c) => c.trim());
    if (cols.length < 4) {
      // ヘッダ行（時刻,種別,行先,のりば）を省略している場合はスキップ
      if (i === 0 && /時刻|time/i.test(cols[0])) continue;
      continue;
    }
    // 時刻の正規化 H:MM か HH:MM のみを受け付ける
    const m = cols[0].match(/^(\d{1,2}):(\d{1,2})$/);
    if (!m) continue;
    const hh = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    const time = `${hh}:${mm}`;
    rows.push({ 時刻: time, 種別: cols[1] || "--", 行先: cols[2] || "--", のりば: cols[3] || "--" });
  }
  // 時刻で昇順ソート
  rows.sort((a, b) => parseInt(a.時刻.replace(":", "")) - parseInt(b.時刻.replace(":", "")));
  return rows;
}

// Apply/Reset ボタンの処理を追加
document.addEventListener("DOMContentLoaded", () => {
  const applyBtn = document.getElementById("apply-timetable");
  const resetBtn = document.getElementById("reset-timetable");
  const textarea = document.getElementById("timetable-input");

  if (applyBtn && textarea) {
    applyBtn.addEventListener("click", () => {
      const parsed = parseTimetableCsv(textarea.value);
      if (parsed.length > 0) {
        timetable = parsed;
        updateDepartureInfo();
      } else {
        alert("CSV の形式が不正か、データがありません。フォーマット: 時刻,種別,行先,のりば");
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      // 元のダミーデータに戻す
      timetable = [
        { 時刻: "05:46", 種別: "普通", 行先: "大阪", のりば: "1" },
        { 時刻: "10:46", 種別: "普通", 行先: "大阪", のりば: "1" },
        { 時刻: "15:46", 種別: "普通", 行先: "大阪", のりば: "1" },
        { 時刻: "19:46", 種別: "普通", 行先: "大阪", のりば: "1" },
        { 時刻: "20:03", 種別: "快速", 行先: "おふろ", のりば: "1" },
        { 時刻: "23:18", 種別: "寝台特急", 行先: "ふとん", のりば: "1" },
        { 時刻: "05:08", 種別: "通勤快速", 行先: "職場", のりば: "1" },
      ];
      updateDepartureInfo();
    });
  }
  // ファイル入力で CSV を読み込む（UTF-8 を想定）
  const fileInput = document.getElementById("timetable-file");
  if (fileInput && textarea) {
    fileInput.addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        let text = reader.result;
        if (typeof text === "string") {
          text = text.replace(/^\uFEFF/, ""); // BOM を削除
          textarea.value = text;
          // 自動適用したければ以下を有効化（今はユーザが「時刻表を適用する」を押す想定）
          // const parsed = parseTimetableCsv(text);
          // if (parsed.length > 0) { timetable = parsed; updateDepartureInfo(); }
        }
      };
      reader.onerror = () => {
        alert("ファイルの読み込みに失敗しました。");
      };
      // UTF-8 として読み込む
      reader.readAsText(f, "UTF-8");
    });
  }
});
