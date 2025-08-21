import { ResultDataType } from "../pages/TeamScores";
import { processTemplate } from "./templateProcessor";

type DownloadType = {
  data: string;
  fileName: string;
  fileType: string;
};

const downloadFile = ({ data, fileName, fileType }: DownloadType) => {
  const blob = new Blob([data], { type: fileType });

  const a = document.createElement("a");
  a.download = fileName;
  a.href = window.URL.createObjectURL(blob);
  const clickEvt = new MouseEvent("click", {
    view: window,
    bubbles: true,
    cancelable: true,
  });
  a.dispatchEvent(clickEvt);
  a.remove();
};

export const exportToCsv = (
  data: ResultDataType,
  fileName: string,
  options?: {
    ignoreColumns?: string[];
    columnRenames?: Record<string, string>;
    customColumns?: Record<string, string>;
    columnValueOverrides?: Record<string, string>;
    capitalizeColumns?: boolean;
  }
) => {
  if (!data || data.data.length === 0) {
    console.error("No data available for export.");
    return;
  }

  const {
    ignoreColumns = [],
    columnRenames = {},
    customColumns = {},
    columnValueOverrides = {},
    capitalizeColumns = false,
  } = options || {};

  // Les en-têtes originaux correspondent aux clés des objets de la ligne
  const originalHeaders = data.headers || Object.keys(data.data[0] || {});
  const customColumnsKeys = Object.keys(customColumns);
  const allHeaders = [...originalHeaders, ...customColumnsKeys];

  // Les en-têtes d'exportation sont les en-têtes visibles pour l'utilisateur
  const visibleHeaders = allHeaders.filter(
    (header) => header !== "subData" && !ignoreColumns.includes(header)
  );

  // Traiter les en-têtes de colonnes
  const processedHeaders = visibleHeaders.map((header) => {
    let displayName = columnRenames[header] || header;
    if (capitalizeColumns) {
      displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    }
    return displayName;
  });

  // Traiter les lignes de données
  const csvDataRows = data.data.map((row) => {
    const values = visibleHeaders.map((header) => {
      let cellValue = row[header];

      // Gérer les colonnes personnalisées
      if (customColumnsKeys.includes(header)) {
        const formula = customColumns[header] || "";
        const allHeadersForTemplate = [
          ...originalHeaders,
          "subData",
          ...customColumnsKeys,
        ];
        // Passer les en-têtes originaux, car ils correspondent aux clés de `row`
        cellValue = processTemplate(formula, "", allHeadersForTemplate, row);
      } else if (columnValueOverrides[header]) {
        // Gérer les surcharges de valeur
        // Passer également les en-têtes originaux
        cellValue = processTemplate(
          columnValueOverrides[header],
          cellValue,
          originalHeaders,
          row
        );
      }

      // Échapper les valeurs pour le format CSV
      if (cellValue && typeof cellValue === "string") {
        if (cellValue.includes(",") || cellValue.includes('"')) {
          cellValue = `"${cellValue.replace(/"/g, '""')}"`;
        }
      }

      return cellValue || "";
    });
    return values.join(",");
  });

  const finalCsvContent = [processedHeaders.join(","), ...csvDataRows].join(
    "\n"
  );

  const name = fileName || "classementParEquipe";
  downloadFile({
    data: finalCsvContent,
    fileName: `${name}.csv`,
    fileType: "text/csv",
  });
};
