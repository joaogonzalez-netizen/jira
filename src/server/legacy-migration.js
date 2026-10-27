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
 * Migra quem tem produto e não move nenhum KR — o formato das iniciativas do
 * Roadmap. Iniciativas de OKR (com KR, ou sem produto) ficam onde estão.
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

export const isLegacyRoadmapInitiative = (i) => !!i && typeof i.product === "string" && i.product.trim() !== "" && !i.keyResultId;

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
