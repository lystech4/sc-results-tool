/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { FileType } from "../pages/TeamScores";
import "./FileUploader.scss";

export type SheetData = {
  sheetName: string;
  data?: any;
  headers?: string[];
};

export default function FileUploader({
  onUpload,
  defaultFile,
}: {
  onUpload: (data: FileType) => void;
  defaultFile?: FileType;
}) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<FileType | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effet pour initialiser avec le fichier par défaut
  useEffect(() => {
    if (defaultFile) {
      setUploadedFile(defaultFile);
      setUploadStatus('success');
    }
  }, [defaultFile]);

  async function loadExcelFile(file: FileType, callback?: any) {
    //f = file
    const reader = new FileReader();
    const f = file?.file;
    reader.onload = async (evt) => {
      // evt = on_file_select event
      /* Parse data */
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      /* Get first worksheet */
      // foreach sheets in workbook
      const sheets: SheetData[] = [];
      wb.SheetNames.forEach((sheetName: string, index: number) => {
        const wsname = wb.SheetNames[index];
        const ws = wb.Sheets[wsname];
        /* Convert array of arrays */
        const data = XLSX.utils.sheet_to_json(ws);
        sheets.push({
          sheetName,
          data,
        });
      });
      callback?.(sheets);
    };

    if (f) reader.readAsBinaryString(f);
  }

  function getHeadersFromData(data: any) {
    // get headers from data by getting first row and getting keys
    const headers = Object.keys(data[0]);
    return headers;
  }

  function getFileData(file: FileType, callback?: any) {
    if (file) {
      //   const data = await XLSX.readFile(file?.name, { raw: false });
      loadExcelFile(file, (sheets: SheetData[]) => {
        // foreach sheets in workbook
        sheets.forEach((sheet: SheetData) => {
          sheet.headers = getHeadersFromData(sheet.data);
        });
        callback(sheets);
      });
    } else {
      console.log("Trying to read file that doesn't exist.");
    }
  }

  function processFile(file: File) {
    setLoading(true);
    setUploadStatus('idle');

    const kbSize = file.size / 1024;
    const mbSize = file.size / 1024 / 1024;
    const gbSize = file.size / 1024 / 1024 / 1024;

    // get the most appropriate size
    const formattedSize =
      gbSize > 1
        ? `${gbSize.toFixed(2)} GB`
        : mbSize > 1
          ? `${mbSize.toFixed(2)} MB`
          : `${kbSize.toFixed(2)} KB`;

    const f: FileType = {
      name: file.name,
      type: file.type,
      size: file.size,
      kbSize: file.size / 1024,
      mbSize: file.size / 1024 / 1024,
      gbSize: file.size / 1024 / 1024 / 1024,
      formattedSize,
      lastModified: file.lastModified,
      webkitRelativePath: file.webkitRelativePath,
      file: file,
    };

    const extension = file?.name.split(".").pop();
    f.extension = extension;
    const cleanName = file?.name.split(".").shift();
    f.cleanName = cleanName;

    getFileData(f, (sheets: SheetData[]) => {
      f.sheets = sheets;
      setUploadedFile(f);
      setLoading(false);
      setUploadStatus('success');
      onUpload(f);
    });
  }

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files) return;
    const file = event.target.files[0] as File;
    if (file) {
      processFile(file);
    }
  }

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleChangeFile = () => {
    setUploadedFile(null);
    setUploadStatus('idle');
    fileInputRef.current?.click();
  };

  const getUploadIcon = () => {
    if (loading) return "⏳";
    if (uploadStatus === 'success') return "✅";
    if (uploadStatus === 'error') return "❌";
    return "📁";
  };

  const getUploadText = () => {
    if (loading) return "Traitement du fichier...";
    if (uploadStatus === 'success') return "Fichier traité avec succès !";
    if (uploadStatus === 'error') return "Erreur lors du traitement";
    return "Glissez-déposez votre fichier ici";
  };

  const getUploadSubtext = () => {
    if (loading) return "Veuillez patienter pendant l'analyse des données";
    if (uploadStatus === 'success') return "Vous pouvez maintenant utiliser vos données";
    if (uploadStatus === 'error') return "Veuillez réessayer avec un fichier valide";
    return "ou cliquez pour sélectionner un fichier";
  };

  return (
    <div className="file-uploader-container">
      <div
        className={`file-uploader ${dragActive ? 'dragover' : ''} ${uploadStatus === 'success' ? 'upload-success' : ''} ${uploadStatus === 'error' ? 'upload-error' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="upload-icon">{getUploadIcon()}</div>

        <div className="upload-text">{getUploadText()}</div>
        <div className="upload-subtext">{getUploadSubtext()}</div>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <span>Analyse en cours...</span>
          </div>
        )}

        {!loading && uploadStatus === 'idle' && (
          <button className="upload-button" onClick={handleButtonClick}>
            Sélectionner un fichier
          </button>
        )}

        {uploadedFile && uploadStatus === 'success' && (
          <div className="file-info">
            <div className="file-name">{uploadedFile.name}</div>
            <div className="file-details">
              <span className="file-size">{uploadedFile.formattedSize}</span>
              <span className="file-type">{uploadedFile.extension?.toUpperCase()}</span>
            </div>
            <button className="change-file-button" onClick={handleChangeFile}>
              Changer de fichier
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="file-input"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={onFileChange}
        />
      </div>

      <div className="supported-formats">
        <div className="format-tag">Excel (.xlsx)</div>
        <div className="format-tag">Excel (.xls)</div>
        <div className="format-tag">CSV (.csv)</div>
      </div>
    </div>
  );
}
