import https from "https";

function parseStreamTitle(block) {
  const match = block.match(/StreamTitle='(.*?)';/s);
  return match?.[1]?.trim() ?? "";
}

const url = "https://icecast.omroep.nl/radio6-bb-mp3";

https
  .get(url, { headers: { "Icy-MetaData": "1", "User-Agent": "BensMusic/1.0" } }, (res) => {
    const metaInt = parseInt(res.headers["icy-metaint"] || "0", 10);
    let buf = Buffer.alloc(0);
    res.on("data", (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      if (buf.length >= metaInt + 256) {
        res.destroy();
        const len = buf[metaInt] * 16;
        const block = buf.subarray(metaInt + 1, metaInt + 1 + len).toString("utf8");
        const title = parseStreamTitle(block);
        const sep = title.indexOf(" - ");
        console.log("streamTitle:", title);
        console.log("artist:", sep > 0 ? title.slice(0, sep) : "");
        console.log("song:", sep > 0 ? title.slice(sep + 3) : title);
      }
    });
  })
  .on("error", console.error);

setTimeout(() => process.exit(0), 30000);
