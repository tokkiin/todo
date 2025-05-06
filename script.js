function updateDepartureInfo() {
  // 現在の時刻を取得
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = `${hours}:${minutes < 10 ? "0" : ""}${minutes}`;

  // 時刻表データ
  const timetable = [
    { 時刻: "10:46", 種別: "普通", 行先: "大阪", のりば: "1" },
    { 時刻: "15:46", 種別: "普通", 行先: "大阪", のりば: "1" },
    { 時刻: "19:46", 種別: "普通", 行先: "大阪", のりば: "1" },
    { 時刻: "20:03", 種別: "快速", 行先: "おふろ", のりば: "1" },
    { 時刻: "23:18", 種別: "寝台特急", 行先: "ふとん", のりば: "1" },
    { 時刻: "05:08", 種別: "通勤快速", 行先: "職場", のりば: "1" },
  ];

  // 直近の電車の情報を取得
  let nextDepartures = [];
  if (typeof timetable !== "undefined" && timetable.length > 0) {
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
    const nextDepartureTime = nextDepartures[0].時刻.replace(":", "");
    const currentTimeNum = `${hours}${minutes < 10 ? "0" : ""}${minutes}`;
    const diff = parseInt(nextDepartureTime) - parseInt(currentTimeNum);

    if (diff >= 10) {
      announcement = "出発まで余裕があります";
    } else if (diff >= 5) {
      announcement = "そろそろ準備してください";
    } else {
      announcement = "急いでください";
    }

    document.getElementById("announcement").textContent = ` ${announcement}`;
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
