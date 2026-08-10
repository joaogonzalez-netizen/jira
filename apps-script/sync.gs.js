/**
 * Apps Script Web App que serve os dados da planilha "[Dados] Jira 2" como JSON,
 * pra contornar o CORS que impede o navegador de chamar a API do Google Sheets direto.
 *
 * COMO INSTALAR (uma vez só):
 * 1. Abra a planilha: https://docs.google.com/spreadsheets/d/1HteBrBkY4XCkmXGMTJIuA2EXAraZsDKw_xjZu0xoUgw/edit
 * 2. Menu Extensões > Apps Script.
 * 3. Apague o conteúdo de Code.gs e cole todo o conteúdo deste arquivo.
 * 4. Clique em "Implantar" (Deploy) > "Nova implantação" (New deployment).
 * 5. Tipo: "App da Web" (Web app).
 *    - Executar como: Eu (seu e-mail)
 *    - Quem tem acesso: Qualquer pessoa (Anyone) — precisa ser "Anyone", não "Anyone with Google account",
 *      senão o fetch() do navegador não consegue ler a resposta.
 * 6. Implantar. O Google vai pedir autorização — aceite (é o script acessando a SUA própria planilha).
 * 7. Copie a URL gerada (termina em /exec).
 * 8. Cole essa URL na constante SHEET_SYNC_URL, em src/App.jsx (linha perto do topo, junto de SHEET_ID).
 *
 * Se editar este script depois, é preciso criar uma "Nova implantação" de novo
 * (ou editar a implantação existente) pra mudança valer — só salvar o código não basta.
 */

function doGet(e) {
  const sheet = SpreadsheetApp.openById('1HteBrBkY4XCkmXGMTJIuA2EXAraZsDKw_xjZu0xoUgw').getSheets()[0];
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      let val = data[i][j];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
      }
      row[headers[j]] = val;
    }
    if (row['Key']) rows.push(row);
  }

  return ContentService
    .createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}
