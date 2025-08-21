/* eslint-disable @typescript-eslint/no-explicit-any */
export function normalizeString(str: string) {
  if (typeof str !== "string") {
    return "";
  }
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function processTemplate(
  template: string,
  originalValue: string,
  allHeaders: string[],
  rowData?: any
) {
  let result = template;

  // Remplace {{{value}}} par la valeur originale
  result = result.replace(/\{\{\{value\}\}\}/g, originalValue || "");

  // Remplace {{{value:1:name:2}}} ou {{{value:1:2}}}
  result = result.replace(/\{\{\{value:([a-zA-Z0-9:]+)\}\}\}/g, (_, path) => {
    // Sépare le chemin en segments
    const pathParts = path.split(":");
    let currentData: any = rowData;

    // Le premier segment est toujours la clé de l'en-tête
    const headerKey = pathParts[0];

    // Accède à l'en-tête, en supportant les index numériques et les noms de colonnes
    const headerIndex = parseInt(headerKey, 10);
    if (!rowData) {
      return allHeaders[headerIndex] || "";
    }

    // Vérifie si la clé est un index numérique valide
    if (!isNaN(headerIndex) && allHeaders[headerIndex]) {
      currentData = rowData[allHeaders[headerIndex]];
    } else {
      // Sinon, recherche l'en-tête par son nom normalisé
      const normalizedHeaderKey = normalizeString(headerKey);
      const foundHeader = allHeaders.find(
        (h) => normalizeString(h) === normalizedHeaderKey
      );

      if (foundHeader) {
        currentData = rowData[foundHeader];
      } else {
        return ""; // En-tête non trouvé
      }
    }

    // Si la première valeur est undefined ou null, on arrête tout
    if (currentData === undefined || currentData === null) {
      return "";
    }

    // Itère sur le reste des segments du chemin
    for (let i = 1; i < pathParts.length; i++) {
      const segment = pathParts[i];

      const index = parseInt(segment, 10);
      const isNumber = !isNaN(index);

      if (isNumber) {
        // Le segment est un index numérique
        if (Array.isArray(currentData) && index < currentData.length) {
          currentData = currentData[index];
        } else if (
          typeof currentData === "string" &&
          index < currentData.length
        ) {
          currentData = currentData[index];
        } else if (typeof currentData === "object" && currentData !== null) {
          const values = Object.values(currentData);
          if (index < values.length) {
            currentData = values[index];
          } else {
            return "";
          }
        } else {
          return "";
        }
      } else {
        // Le segment est un nom de propriété (chaîne)
        if (typeof currentData === "object" && currentData !== null) {
          const normalizedSegment = normalizeString(segment);
          const foundKey = Object.keys(currentData).find(
            (key) => normalizeString(key) === normalizedSegment
          );

          if (foundKey) {
            currentData = currentData[foundKey];
          } else {
            return ""; // Propriété non trouvée
          }
        } else {
          return "";
        }
      }

      if (currentData === undefined || currentData === null) {
        return "";
      }
    }

    return String(currentData);
  });

  return result;
}
