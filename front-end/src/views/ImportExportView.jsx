import React, { useState } from "react";
import { usePasswords } from "../contexts/PasswordContext";


const ImportExportView = () => {
  const { passwordArray, addPassword } = usePasswords();
  const [exportFormat, setExportFormat] = useState('json');
  const [importFile, setImportFile] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);


  const handleExport = async (format) => {
    setIsExporting(true);
    
    try {
      let dataToExport;
      let filename;
      let mimeType;


      if (format === 'json') {
        dataToExport = JSON.stringify(passwordArray, null, 2);
        filename = `passwords_backup_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else if (format === 'csv') {
        const headers = ['Site/Service', 'Username', 'Password', 'Category', 'Website URL', 'Notes'];
        const csvData = passwordArray.map(item => [
          item.siteService || '',
          item.username || '',
          item.password || '',
          item.category || '',
          item.websiteUrl || '',
          item.notes || ''
        ]);
        
        const csvContent = [headers, ...csvData]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');
        
        dataToExport = csvContent;
        filename = `passwords_backup_${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      }


      // Create and download file
      const blob = new Blob([dataToExport], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };


  const handleImport = async () => {
    if (!importFile) return;
    
    setIsImporting(true);
    
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      
      if (Array.isArray(data)) {
        // Import each password
        for (const passwordData of data) {
          await addPassword(passwordData);
        }
        alert(`Successfully imported ${data.length} passwords`);
      } else {
        throw new Error('Invalid file format');
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please check your file format.');
    } finally {
      setIsImporting(false);
      setImportFile(null);
    }
  };


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
            <span>Import & Export</span>
            <span className="text-gray-600 text-xs sm:text-sm flex items-center gap-1">
              💾 Backup & Restore
            </span>
          </h1>
        </div>
      </div>


      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="text-yellow-600 text-lg sm:text-xl flex-shrink-0">⚠️</div>
          <div className="min-w-0">
            <h3 className="text-yellow-800 font-semibold mb-1 text-sm sm:text-base">Security Notice</h3>
            <p className="text-yellow-700 text-xs sm:text-sm">
              Exported files contain your passwords in plain text. Store them securely and delete after use. 
              Never share these files or store them in unsecured locations.
            </p>
          </div>
        </div>
      </div>


      {/* Export Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 md:p-6 shadow">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-4">Export Passwords</h2>
        <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
          Download your passwords for backup or migration to another password manager.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* JSON Export */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 text-base sm:text-xl">
                📄
              </div>
              <div className="min-w-0">
                <h3 className="text-gray-900 font-semibold text-sm sm:text-base">JSON Format</h3>
                <p className="text-gray-600 text-xs sm:text-sm">Structured data, easy to reimport</p>
              </div>
            </div>
            <button
              onClick={() => handleExport('json')}
              disabled={isExporting || passwordArray.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-3 sm:px-4 rounded-md transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span className="hidden sm:inline">Exporting...</span>
                  <span className="sm:hidden">Export...</span>
                </>
              ) : (
                <>
                  <span>⬇️</span>
                  <span className="hidden sm:inline">Export as JSON</span>
                  <span className="sm:hidden">JSON</span>
                </>
              )}
            </button>
          </div>


          {/* CSV Export */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0 text-base sm:text-xl">
                📊
              </div>
              <div className="min-w-0">
                <h3 className="text-gray-900 font-semibold text-sm sm:text-base">CSV Format</h3>
                <p className="text-gray-600 text-xs sm:text-sm">Spreadsheet compatible</p>
              </div>
            </div>
            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting || passwordArray.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-3 sm:px-4 rounded-md transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span className="hidden sm:inline">Exporting...</span>
                  <span className="sm:hidden">Export...</span>
                </>
              ) : (
                <>
                  <span>⬇️</span>
                  <span className="hidden sm:inline">Export as CSV</span>
                  <span className="sm:hidden">CSV</span>
                </>
              )}
            </button>
          </div>
        </div>


        <div className="text-xs sm:text-sm text-gray-600">
          Total passwords to export: <span className="font-semibold">{passwordArray.length}</span>
        </div>
      </div>


      {/* Import Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 md:p-6 shadow">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-4">Import Passwords</h2>
        <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
          Import passwords from a JSON backup file. The data should contain site, username, password, and category fields.
        </p>


        <div className="space-y-3 sm:space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Select JSON backup file
            </label>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files[0])}
              className="block w-full text-xs sm:text-sm text-gray-600 file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
            />
          </div>


          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={!importFile || isImporting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 sm:px-6 rounded-md transition-colors flex items-center gap-2 text-sm sm:text-base"
          >
            {isImporting ? (
              <>
                <div className="animate-spin w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span className="hidden sm:inline">Importing...</span>
                <span className="sm:hidden">Import...</span>
              </>
            ) : (
              <>
                ⬆️ Import Passwords
              </>
            )}
          </button>


          {/* File Info */}
          {importFile && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-xs sm:text-sm text-gray-700">
                <strong>Selected file:</strong> <span className="break-all">{importFile.name}</span>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">
                Size: {(importFile.size / 1024).toFixed(2)} KB
              </div>
            </div>
          )}
        </div>


        {/* Import Instructions */}
        <div className="mt-4 sm:mt-6 bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
          <h4 className="text-gray-900 font-medium mb-2 text-sm sm:text-base">Import Requirements:</h4>
          <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
            <li>• File must be in JSON format</li>
            <li>• Each password entry should include: siteService, username, password</li>
            <li>• Optional fields: category, websiteUrl, notes</li>
            <li>• Maximum file size: 10MB</li>
          </ul>
        </div>
      </div>
    </div>
  );
};


export default ImportExportView;
