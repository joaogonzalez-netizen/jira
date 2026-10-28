/**
 * Migração única: as iniciativas criadas no Roadmap (uma por produto, com
 * épicos) eram, na prática, partes do produto — viram Features. Iniciativa
 * passa a ser só a aposta grande do OKR.
 *
 * Roda na primeira leitura de iniciativas ou do planejamento (as duas telas
 * carregam juntas), protegida por uma flag no Redis para acontecer uma vez só,
 * mesmo com requests concorrentes. Antes de mexer, guarda a lista original em
 * `jira:backup:initiatives-before-features`.
 *
 * Migra quem tem produto e não está ligado a objetivo nem KR — o formato das
 * iniciativas do Roadmap. Iniciativas de OKR (com objetivo, KR, ou sem produto)
 * ficam onde estão.
 */
const FLAG = "jira:migrations:initiatives-to-features";
const INITIATIVES = "jira:initiatives";
const FEATURES = "jira:features";
const BACKUP = "jira:backup:initiatives-before-features";

function parse(raw) {
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export const isLegacyRoadmapInitiative = (i) => !!i && typeof i.product === "string" && i.product.trim() !== "" && !i.keyResultId && !i.objectiveId;

async function waitDone(client) {
  for (let i = 0; i < 30; i++) {
    if ((await client.get(FLAG)) === "done") return;
    await new Promise((r) => setTimeout(r, 100));
  }
}

export async function migrateInitiativesToFeatures(client) {
  const flag = await client.get(FLAG);
  if (flag === "done") return;
  if (flag !== null || (await client.set(FLAG, "running", { NX: true })) !== "OK") {
    await waitDone(client);
    return;
  }
  try {
    const initiatives = parse(await client.get(INITIATIVES));
    const legacy = initiatives.filter(isLegacyRoadmapInitiative);
    if (legacy.length) {
      await client.set(BACKUP, JSON.stringify(initiatives));
      const features = parse(await client.get(FEATURES));
      const known = new Set(features.map((f) => f.id));
      // Um épico fica numa feature só: se já estiver numa, continua lá.
      const taken = new Set(features.flatMap((f) => f.epicKeys || []));
      const migrated = legacy
        .filter((i) => !known.has(i.id)) // retomada depois de uma falha no meio
        .map((i) => {
          const epicKeys = (i.epicKeys || []).filter((k) => typeof k === "string" && !taken.has(k));
          epicKeys.forEach((k) => taken.add(k));
          return {
            id: i.id, name: i.name, product: i.product.trim(), description: "", status: "Ativa", epicKeys,
            createdBy: i.createdBy || null, createdAt: i.createdAt || new Date().toISOString(), migratedFrom: "initiative",
          };
        });
      // Features primeiro: se cair entre as duas gravações, a retomada não duplica (ids iguais).
      await client.set(FEATURES, JSON.stringify([...features, ...migrated]));
      await client.set(INITIATIVES, JSON.stringify(initiatives.filter((i) => !isLegacyRoadmapInitiative(i))));
    }
    await client.set(FLAG, "done");
  } catch (e) {
    await client.del(FLAG);
    throw e;
  }
}

/* ---------------------------------------------------------------------
   Segunda migração: Iniciativa e Key Result viraram um item só (Key Result).
   Cada iniciativa que sobrou (as de OKR) vira um KR do objetivo dela, com o
   mesmo id; a que já movia um KR soma os épicos, links, quarter e produto a
   esse KR. Backup em `jira:backup:initiatives-before-krs`.
   --------------------------------------------------------------------- */
const KR_FLAG = "jira:migrations:initiatives-to-krs";
const KEY_RESULTS = "jira:key-results";
const KR_BACKUP = "jira:backup:initiatives-before-krs";
const KR_STATUS = { Planejada: "Planejado", "Em andamento": "Em andamento", Pausada: "Pausado", "Concluída": "Concluído", Cancelada: "Cancelado" };

async function waitFlag(client, flag) {
  for (let i = 0; i < 30; i++) {
    if ((await client.get(flag)) === "done") return;
    await new Promise((r) => setTimeout(r, 100));
  }
}

export async function migrateInitiativesToKeyResults(client) {
  const flag = await client.get(KR_FLAG);
  if (flag === "done") return;
  if (flag !== null || (await client.set(KR_FLAG, "running", { NX: true })) !== "OK") {
    await waitFlag(client, KR_FLAG);
    return;
  }
  try {
    const initiatives = parse(await client.get(INITIATIVES));
    const pending = initiatives.filter((i) => !isLegacyRoadmapInitiative(i));
    if (pending.length) {
      await client.set(KR_BACKUP, JSON.stringify(initiatives));
      const krs = parse(await client.get(KEY_RESULTS));
      const byId = Object.fromEntries(krs.map((k) => [k.id, k]));
      // Um épico fica num KR só: o primeiro que o tiver fica com ele.
      const taken = new Set(krs.flatMap((k) => k.epicKeys || []));
      const created = [];
      for (const i of pending) {
        const epicKeys = (i.epicKeys || []).filter((k) => typeof k === "string" && !taken.has(k));
        epicKeys.forEach((k) => taken.add(k));
        const links = Array.isArray(i.links) ? i.links : [];
        const target = i.keyResultId && byId[i.keyResultId];
        if (target) {
          target.epicKeys = [...(target.epicKeys || []), ...epicKeys];
          target.links = [...(target.links || []), ...links.filter((l) => !(target.links || []).some((x) => x.url === l.url))];
          if (!target.quarter && i.quarter) target.quarter = i.quarter;
          if (!target.product && i.product) target.product = i.product;
          if (!target.dueDate && i.dueDate) target.dueDate = i.dueDate;
          continue;
        }
        if (byId[i.id]) continue; // retomada depois de uma falha no meio
        created.push({
          id: i.id, name: i.name, objectiveId: i.objectiveId || "", owner: "", product: i.product || "", quarter: i.quarter || "",
          description: i.description || "", unit: "", baseline: null, target: null, current: null, dueDate: i.dueDate || "",
          status: KR_STATUS[i.status] || "Em andamento", links, epicKeys, checkins: [],
          createdBy: i.createdBy || null, createdAt: i.createdAt || new Date().toISOString(), migratedFrom: "initiative",
        });
      }
      await client.set(KEY_RESULTS, JSON.stringify([...krs, ...created]));
      await client.set(INITIATIVES, JSON.stringify(initiatives.filter(isLegacyRoadmapInitiative)));
    }
    await client.set(KR_FLAG, "done");
  } catch (e) {
    await client.del(KR_FLAG);
    throw e;
  }
}

/** As duas migrações, na ordem: as do Roadmap viram features, o resto vira KR. */
export async function runMigrations(client) {
  await migrateInitiativesToFeatures(client);
  await migrateInitiativesToKeyResults(client);
}
