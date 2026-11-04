// Minimal in-memory Redis (RESP2) for local mock mode — never used in prod.
// Covers what the server cores call: GET, SET (NX/EX/PX), DEL, EXISTS and the
// roadmap compare-and-set EVAL; handshake commands just answer OK.
import net from "node:net";

export function startFakeRedis(port, seed = {}) {
  const db = new Map(Object.entries(seed).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)]));

  const bulk = (v) => (v === null || v === undefined ? "$-1\r\n" : `$${Buffer.byteLength(v)}\r\n${v}\r\n`);
  const int = (n) => `:${n}\r\n`;
  const ok = "+OK\r\n";

  function run([cmd, ...args]) {
    switch (String(cmd).toUpperCase()) {
      case "GET": return bulk(db.get(args[0]) ?? null);
      case "SET": {
        const [key, value, ...opts] = args;
        const nx = opts.some((o) => String(o).toUpperCase() === "NX");
        if (nx && db.has(key)) return bulk(null);
        db.set(key, value);
        return ok;
      }
      case "DEL": return int(args.filter((k) => db.delete(k)).length);
      case "EXISTS": return int(args.filter((k) => db.has(k)).length);
      case "EVAL": {
        // Only the roadmap CAS script: SET KEYS[1]=ARGV[2] if it still holds ARGV[1].
        const n = Number(args[1]);
        const [key] = args.slice(2, 2 + n);
        const [expected, next] = args.slice(2 + n);
        if ((db.get(key) ?? "") !== expected) return int(0);
        db.set(key, next);
        return int(1);
      }
      case "PING": return "+PONG\r\n";
      default: return ok; // HELLO, CLIENT, SELECT, INFO…
    }
  }

  function parse(buf) {
    const cmds = [];
    let i = 0;
    const line = () => {
      const end = buf.indexOf("\r\n", i);
      if (end === -1) return null;
      const s = buf.toString("utf8", i, end);
      i = end + 2;
      return s;
    };
    while (i < buf.length) {
      const start = i;
      const head = line();
      if (head === null || head[0] !== "*") { i = start; break; }
      const args = [];
      let complete = true;
      for (let k = 0; k < Number(head.slice(1)); k++) {
        const len = line();
        if (len === null) { complete = false; break; }
        const size = Number(len.slice(1));
        if (i + size + 2 > buf.length) { complete = false; break; }
        args.push(buf.toString("utf8", i, i + size));
        i += size + 2;
      }
      if (!complete) { i = start; break; }
      cmds.push(args);
    }
    return { cmds, rest: buf.subarray(i) };
  }

  const server = net.createServer((sock) => {
    let pending = Buffer.alloc(0);
    sock.on("data", (chunk) => {
      const { cmds, rest } = parse(Buffer.concat([pending, chunk]));
      pending = rest;
      for (const c of cmds) sock.write(run(c));
    });
    sock.on("error", () => sock.destroy());
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}
