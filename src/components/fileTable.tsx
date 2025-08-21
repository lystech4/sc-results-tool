/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import "./fileTable.scss";
import { SheetData } from "./FileUploader";
import { useContextMenuHandler } from "../Contexts/ContextMenuProvider";
import { ExportIcon } from "@phosphor-icons/react";
import { processTemplate } from "../utils/templateProcessor";

type Props = {
  id?: string;
  sheet?: SheetData;
  data?: any[];
  title?: string;
  ignoreColumns?: string[];
  showComplete?: boolean;
  columnRenames?: Record<string, string>;
  customColumns?: Record<string, string>;
  columnValueOverrides?: Record<string, string>;
  capitalizeColumns?: boolean;
  renderSubData?: (subData: any[], index: number) => React.ReactNode;
};

export default function FileTable({
  id,
  sheet,
  data,
  title,
  ignoreColumns,
  showComplete,
  columnRenames,
  customColumns,
  columnValueOverrides,
  capitalizeColumns,
  renderSubData,
}: Props) {
  const { handleContextMenu } = useContextMenuHandler();

  const [selectedRow, setSelectedRow] = useState<any>(data?.[0]);
  if (data) {
    const headers = Object.keys(data[0]);
    const customColumnsKeys = Object.keys(customColumns || {});
    const allHeadersWithCustom = [...headers, ...customColumnsKeys];

    const hasSubdata = data?.[0]?.subData;

    return (
      <td id={id} className="file-table" onContextMenu={(e) => {
        handleContextMenu(e, [
          {
            label: "Exporter les données",
            icon: <ExportIcon size={22} />,
            onClick: () => {
              const fileName = `table_export_${title || "data"}.csv`;
              // Filter out subData from headers
              const exportHeaders = allHeadersWithCustom.filter(header => header !== 'subData' && !ignoreColumns?.includes(header));
              const csvContent = [
                exportHeaders
                  .map(header => {
                    let name = columnRenames?.[header] || header;
                    if (capitalizeColumns) {
                      name = name.charAt(0).toUpperCase() + name.slice(1);
                    }
                    return name;
                  })
                  .join(","),
                ...data.map(row =>
                  exportHeaders.map(key => {
                    let cellValue = row[key];
                    // Handle custom columns
                    if (customColumnsKeys.includes(key)) {
                      const formula = customColumns?.[key] || '';
                      cellValue = processTemplate(formula, '', headers, row);
                    } else if (columnValueOverrides?.[key]) {
                      // Handle value overrides for existing columns
                      cellValue = processTemplate(columnValueOverrides[key], cellValue, headers, row);
                    }
                    return cellValue;
                  }).join(",")
                )
              ].join("\n");
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.setAttribute("download", fileName);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          }
        ])
      }
      }>
        {title && <h2 className="title">{title}</h2>}
        <table>
          <thead className={capitalizeColumns ? "capitalize" : ""}>
            <tr>
              {allHeadersWithCustom?.map((header, headerIndex: number) => {
                const headerKey = `${headerIndex}-header`;
                if (ignoreColumns?.includes(header)) return <></>;
                let displayName = columnRenames?.[header] || header;
                // Process template for header names
                displayName = processTemplate(displayName, header, headers);
                return <th key={headerKey}>{displayName}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {data?.map((row: any, colIndex: number) => {
              const colKey = `${colIndex}-col`;
              const baseHeaders = allHeadersWithCustom;
              const isIncomplete = Object.keys(row).length < headers.length;
              return (
                <>
                  <tr
                    className={`${row === selectedRow ? "highlight" : ""} ${hasSubdata ? "selectable" : ""
                      } ${showComplete
                        ? isIncomplete
                          ? "incomplete"
                          : "complete"
                        : ""
                      }`}
                    key={colKey}
                    onClick={() => {
                      if (row === selectedRow) setSelectedRow(null);
                      else setSelectedRow(row);
                    }}
                  >
                    {baseHeaders.map((key, rowIndex: number) => {
                      const rowKey = `${colIndex}-${rowIndex}-${key}`;
                      if (ignoreColumns?.includes(key)) {
                        return <></>;
                      }
                      const isLast = rowIndex === baseHeaders.filter(h => !ignoreColumns?.includes(h)).length - 1;

                      let cellValue = row[key];

                      // Handle custom columns
                      if (customColumnsKeys.includes(key)) {
                        const formula = customColumns?.[key] || '';
                        cellValue = processTemplate(formula, '', headers, row);
                      } else if (columnValueOverrides?.[key]) {
                        // Handle value overrides for existing columns
                        cellValue = processTemplate(columnValueOverrides[key], cellValue, headers, row);
                      }

                      return (
                        <td key={rowKey} className={isLast ? "last" : ""}>
                          <span className="cell-content">{cellValue}</span>
                        </td>
                      );
                    })}
                    {row === selectedRow &&
                      selectedRow &&
                      selectedRow.subData &&
                      renderSubData && (
                        renderSubData(selectedRow.subData, colIndex)
                      )}
                  </tr>
                </>
              );
            })}
          </tbody>
        </table>
      </td>
    );
  }

  if (sheet) {
    const headers = sheet.headers || [];
    const customColumnsKeys = Object.keys(customColumns || {});
    const allHeadersWithCustom = [...headers, ...customColumnsKeys];

    return (
      <tr className="file-table">
        {title && <h2 className="title">{title}</h2>}
        <table>
          <thead className={capitalizeColumns ? "capitalize" : ""}>
            <tr>
              {allHeadersWithCustom?.map((header, headerIndex: number) => {
                if (ignoreColumns?.includes(header)) return <></>;
                const headerKey = `${header}-${headerIndex}-header`;
                let displayName = columnRenames?.[header] || header;
                // Process template for header names
                displayName = processTemplate(displayName, header, headers);
                return <th key={headerKey}>{displayName}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {sheet?.data?.map((row: any, colIndex: number) => {
              const colKey = `${colIndex}-col`;

              return (
                <tr key={colKey}>
                  {allHeadersWithCustom.map((key, rowIndex: number) => {
                    if (ignoreColumns?.includes(key)) return <></>;
                    const rowKey = `${colIndex}-${rowIndex}-${key}`;

                    let cellValue = row[key];

                    // Handle custom columns
                    if (customColumnsKeys.includes(key)) {
                      const formula = customColumns?.[key] || '';
                      cellValue = processTemplate(formula, '', headers, row);
                    } else if (columnValueOverrides?.[key]) {
                      // Handle value overrides for existing columns
                      cellValue = processTemplate(columnValueOverrides[key], cellValue, headers, row);
                    }

                    return <td key={rowKey}>{cellValue}</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </tr>
    );
  }

  return <div>Aucune données à afficher</div>;
}
