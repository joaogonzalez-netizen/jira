/**
 * Encaixe dos cards da tela Entregas: cada card ocupa as colunas de semana de
 * `start` a `end` (índices, inclusive). Cards que se sobrepõem em alguma
 * semana vão para sub-linhas diferentes; os que não se tocam dividem a mesma
 * sub-linha. Respeita a ordem recebida: quem vem antes escolhe primeiro e
 * fica na sub-linha mais de cima que couber.
 */
export function packRows(items) {
  const rows = []; // intervalos ocupados de cada sub-linha
  const rowOf = {};
  for (const { key, start, end } of items) {
    let r = rows.findIndex((taken) => taken.every((t) => end < t.start || start > t.end));
    if (r === -1) {
      r = rows.length;
      rows.push([]);
    }
    rows[r].push({ start, end });
    rowOf[key] = r;
  }
  return { rowOf, rowCount: Math.max(rows.length, 1) };
}
