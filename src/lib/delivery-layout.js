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

/**
 * Linhas do quadro, uma por feature, uma debaixo da outra. Cada feature ocupa tantas linhas da grade quantas
 * precisar: as sub-linhas dos cards de semana (`packRows`) OU, se forem mais, uma por card de "Próximas
 * entregas" (cada um fica na própria linha). A feature seguinte começa DEPOIS das linhas que esta ocupa de
 * fato — senão os cards das duas se sobrepõem na mesma linha da grade.
 * `features` = `[{ cards: [{ key, start, end }], upcomingCount }]`; devolve `[{ rowOf, rowCount, gridRow }]`.
 */
export function layoutFeatureRows(features, firstRow = 2) {
  let next = firstRow;
  return features.map(({ cards, upcomingCount }) => {
    const { rowOf, rowCount: packed } = packRows(cards);
    const rowCount = Math.max(packed, upcomingCount);
    const placed = { rowOf, rowCount, gridRow: next };
    next += rowCount;
    return placed;
  });
}
