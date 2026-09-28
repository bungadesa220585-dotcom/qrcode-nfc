import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileArchive,
  RefreshCw,
  FolderKanban,
  FileText
} from 'lucide-react';
import { CodeItem, CodeType, ProjectItem } from '../types.ts';
import { createBulkExportZip, downloadBlob } from '../lib/codeRender.ts';
import { isValidHttpUrl } from '../lib/safeUrl.ts';

interface BulkGeneratorViewProps {
  projects: ProjectItem[];
  onImportBulk: (
    items: Array<{
      name: string;
      uniqueId?: string;
      destinationUrl: string;
      codeType: CodeType;
      barcodeFormat?: any;
      projectName?: string;
    }>
  ) => { created: number; errors: Array<{ row: number; reason: string }> };
  allCodes: CodeItem[];
}

export const BulkGeneratorView: React.FC<BulkGeneratorViewProps> = ({
  projects,
  onImportBulk,
  allCodes
}) => {
  const [csvText, setCsvText] = useState<string>(
    `name,uniqueId,destinationUrl,codeType,projectName\n"VIP Table 1","NFC-TBL01","https://example.com/order?table=1","nfc","Cafe Menu & Table NFCs"\n"VIP Table 2","NFC-TBL02","https://example.com/order?table=2","nfc","Cafe Menu & Table NFCs"\n"Product SKU 104","BAR-104","https://example.com/item/104","barcode","Retail Store & Shelf Tags"\n"Promo Brochure Fall","FALL26","https://example.com/fall-promo","qr","Retail Store & Shelf Tags"`
  );

  const [validationResults, setValidationResults] = useState<{
    validRows: any[];
    invalidRows: Array<{ row: number; reason: string; line: string }>;
  } | null>(null);

  const [importReport, setImportReport] = useState<{
    created: number;
    errors: Array<{ row: number; reason: string }>;
  } | null>(null);

  const [isExportingZip, setIsExportingZip] = useState(false);

  // Validate CSV text
  const handleValidate = () => {
    const lines = csvText.trim().split('\n');
    if (lines.length <= 1) {
      setValidationResults({
        validRows: [],
        invalidRows: [{ row: 1, reason: 'Empty or header-only CSV provided', line: '' }]
      });
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const validRows: any[] = [];
    const invalidRows: Array<{ row: number; reason: string; line: string }> = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Basic CSV splitter respecting quotes
      const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      const cleanVals = values.map((v) => v.trim().replace(/^["']|["']$/g, ''));

      const rowObj: any = {};
      headers.forEach((h, idx) => {
        rowObj[h] = cleanVals[idx] || '';
      });

      const rowNum = i + 1;

      // Validation rules
      if (!rowObj.name) {
        invalidRows.push({ row: rowNum, reason: 'Missing code name', line });
        continue;
      }

      if (!rowObj.destinationUrl) {
        invalidRows.push({ row: rowNum, reason: 'Missing destination URL', line });
        continue;
      }

      if (!isValidHttpUrl(rowObj.destinationUrl)) {
        invalidRows.push({
          row: rowNum,
          reason: `Invalid or unsafe destination URL '${rowObj.destinationUrl}'`,
          line
        });
        continue;
      }

      const type = (rowObj.codeType || 'qr').toLowerCase();
      if (type !== 'qr' && type !== 'nfc' && type !== 'barcode') {
        invalidRows.push({
          row: rowNum,
          reason: `Invalid codeType '${type}'. Must be 'qr', 'nfc', or 'barcode'`,
          line
        });
        continue;
      }

      validRows.push({
        name: rowObj.name,
        uniqueId: rowObj.uniqueId,
        destinationUrl: rowObj.destinationUrl,
        codeType: type as CodeType,
        barcodeFormat: type === 'barcode' ? 'CODE128' : undefined,
        projectName: rowObj.projectName
      });
    }

    setValidationResults({ validRows, invalidRows });
    setImportReport(null);
  };

  // Execute Import
  const handleExecuteImport = () => {
    if (!validationResults || validationResults.validRows.length === 0) return;

    const res = onImportBulk(validationResults.validRows);
    setImportReport(res);
    setValidationResults(null);
  };

  // Download Sample Template CSV
  const handleDownloadSample = () => {
    const sample = `name,uniqueId,destinationUrl,codeType,projectName\n"VIP Table 1","NFC-TBL01","https://example.com/order?table=1","nfc","Cafe Menu & Table NFCs"\n"Product SKU 104","BAR-104","https://example.com/item/104","barcode","Retail Store & Shelf Tags"\n"Promo Brochure Fall","FALL26","https://example.com/fall-promo","qr","Retail Store & Shelf Tags"`;
    const blob = new Blob([sample], { type: 'text/csv' });
    downloadBlob(blob, 'linktag_bulk_template.csv');
  };

  // Export All as ZIP (PRD Section 4.13)
  const handleExportZip = async () => {
    setIsExportingZip(true);
    try {
      const blob = await createBulkExportZip(allCodes, window.location.origin);
      downloadBlob(blob, `linktag_batch_export_${Date.now()}.zip`);
    } catch (err) {
      console.error('ZIP export failed:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
            Bulk Generator & Batch Exporter
          </h2>
          <p className="text-xs text-slate-400">
            Import hundreds of dynamic codes via CSV, validate syntax, and export ZIP bundles with high-resolution code images.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleDownloadSample}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Template CSV
          </button>

          <button
            onClick={handleExportZip}
            disabled={isExportingZip || allCodes.length === 0}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            {isExportingZip ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileArchive className="w-3.5 h-3.5" />
            )}
            Download ZIP Bundle ({allCodes.length})
          </button>
        </div>
      </div>

      {/* CSV Input Panel */}
      <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
            Paste CSV Data
          </label>
          <span className="text-[11px] text-slate-400 font-mono">
            Columns: name, uniqueId, destinationUrl, codeType, projectName
          </span>
        </div>

        <textarea
          value={csvText}
          onChange={(e) => {
            setCsvText(e.target.value);
            setValidationResults(null);
            setImportReport(null);
          }}
          rows={7}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 selection:bg-indigo-600"
          placeholder="Paste CSV rows here..."
        />

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-400">
            System will validate every URL and verify unique IDs before writing to the database.
          </div>

          <button
            onClick={handleValidate}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            Validate Data
          </button>
        </div>
      </div>

      {/* Validation Results Drawer */}
      {validationResults && (
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold font-mono">
                <CheckCircle2 className="w-4 h-4" /> {validationResults.validRows.length} Valid
              </span>
              {validationResults.invalidRows.length > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold font-mono">
                  <AlertTriangle className="w-4 h-4" /> {validationResults.invalidRows.length} Errors
                </span>
              )}
            </div>

            {validationResults.validRows.length > 0 && (
              <button
                onClick={handleExecuteImport}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                Import {validationResults.validRows.length} Codes Now
              </button>
            )}
          </div>

          {/* Invalid Rows Table */}
          {validationResults.invalidRows.length > 0 && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg space-y-2">
              <div className="text-xs font-semibold text-rose-300">
                The following rows have errors and will be skipped:
              </div>
              <div className="space-y-1 text-[11px] font-mono text-rose-200">
                {validationResults.invalidRows.map((err, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold shrink-0">Row {err.row}:</span>
                    <span>{err.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Valid Preview Table */}
          {validationResults.validRows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-mono">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">ID</th>
                    <th className="pb-2">Destination URL</th>
                    <th className="pb-2">Project</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {validationResults.validRows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="py-2 pr-3 font-sans text-slate-200">{row.name}</td>
                      <td className="py-2 px-3 uppercase text-indigo-400">{row.codeType}</td>
                      <td className="py-2 px-3 text-slate-400">{row.uniqueId || '(Auto)'}</td>
                      <td className="py-2 px-3 text-slate-300 max-w-xs truncate">{row.destinationUrl}</td>
                      <td className="py-2 pl-3 text-slate-400">{row.projectName || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Import Execution Report */}
      {importReport && (
        <div className="p-5 bg-slate-900 rounded-xl border border-emerald-500/40 space-y-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            Bulk Import Complete: {importReport.created} Codes Successfully Created
          </div>
          <p className="text-xs text-slate-300">
            Intermediate URLs and redirect records have been provisioned in the database. You can now download the ZIP package with all generated QR codes and barcodes.
          </p>

          <button
            onClick={handleExportZip}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2"
          >
            <FileArchive className="w-4 h-4" />
            Download ZIP with Code Images & Manifest
          </button>
        </div>
      )}
    </div>
  );
};
