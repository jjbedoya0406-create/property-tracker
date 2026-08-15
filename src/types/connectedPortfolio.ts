// A bookmark, in the signed-in account's own spreadsheet, pointing at
// another spreadsheet this account has been given access to via the
// Google Picker (issue #3). Never mutates the connected spreadsheet
// itself — purely a local "portfolios I can switch into" list.
export interface ConnectedPortfolio {
  connectionId: string;
  spreadsheetId: string;
  label: string;
  createdAt: string;
}
