import { appendValues, getValues } from "../api/sheets/client";
import type { ConnectedPortfolio } from "../types";

// Matches the ConnectedPortfolios tab shape (issue #3): connection_id,
// spreadsheet_id, label, created_at. Lives in the signed-in account's own
// spreadsheet only. Row 1 is the header (written once in
// data/portfolio.ts), data starts at row 2. Append/read only — no
// rename/remove for v1.
const SHEET_NAME = "ConnectedPortfolios";
const DATA_RANGE = `${SHEET_NAME}!A2:D`;

function rowToConnectedPortfolio(row: unknown[]): ConnectedPortfolio {
  const [connectionId, spreadsheetId, label, createdAt] = row as string[];
  return { connectionId, spreadsheetId, label, createdAt };
}

function connectedPortfolioToRow(
  connection: ConnectedPortfolio,
): unknown[] {
  return [
    connection.connectionId,
    connection.spreadsheetId,
    connection.label,
    connection.createdAt,
  ];
}

export async function listConnectedPortfolios(
  accessToken: string,
  spreadsheetId: string,
): Promise<ConnectedPortfolio[]> {
  const { values } = await getValues(accessToken, spreadsheetId, DATA_RANGE);
  return (values ?? [])
    .filter((row) => Array.isArray(row) && row[0])
    .map(rowToConnectedPortfolio);
}

export async function addConnectedPortfolio(
  accessToken: string,
  spreadsheetId: string,
  input: { spreadsheetId: string; label: string },
): Promise<ConnectedPortfolio> {
  const connection: ConnectedPortfolio = {
    connectionId: crypto.randomUUID(),
    spreadsheetId: input.spreadsheetId,
    label: input.label,
    createdAt: new Date().toISOString(),
  };
  await appendValues(accessToken, spreadsheetId, DATA_RANGE, [
    connectedPortfolioToRow(connection),
  ]);
  return connection;
}
