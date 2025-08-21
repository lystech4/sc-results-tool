/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import FileUploader, { SheetData } from "../components/FileUploader";
import "./teamScores.scss";
import FileTable from "../components/FileTable";
import { Button, Card, Checkbox, Collapse, Divider, Input, Select, Tag } from "antd"
import { exportToCsv } from "../utils/exportManager";
import { useEffect, useMemo, useState } from "react";
import logo from "./../assets/sc_logo.png";
import { FileArrowDownIcon, FileXIcon, TableIcon, TrashIcon } from "@phosphor-icons/react";
import { Configuration, ConfigurationLoader, ConfigurationSaver } from "../components/ConfigurationManager";


export type FileType = {
  name: string;
  cleanName?: string;
  type: string;
  size: number;
  kbSize?: number;
  mbSize?: number;
  gbSize?: number;
  formattedSize?: string;
  lastModified: number;
  lastModifiedDate?: Date | null;
  webkitRelativePath: string;
  extension?: string;
  sheets?: SheetData[];

  file: File;
} | null;

export type ResultDataType = {
  data: any[];
  headers: string[];
} | null;

export default function TeamScores() {
  const [file, setFile] = useState<FileType>(
    JSON.parse(localStorage.getItem("file") || "null")
  );

  // State to track the currently loaded configuration
  const [currentLoadedConfig, setCurrentLoadedConfig] = useState<string | null>(null);

  // State for advanced options (Simple by default)
  const [advancedOptionsEnabled, setAdvancedOptionsEnabled] = useState<boolean>(
    localStorage.getItem("advancedOptionsEnabled") === "true"
  );

  const [currentSheet, setCurrentSheet] = useState<SheetData>({
    sheetName: "",
    data: null,
    headers: [],
  });

  const [capitalizeColumns, setCapitalizeColumns] = useState<boolean>(localStorage.getItem("capitalizeColumns") !== "false");

  useEffect(() => {
    localStorage.setItem("capitalizeColumns", capitalizeColumns.toString());
  }, [capitalizeColumns]);


  useEffect(() => {
    setCalculatedScores(null);
  }, [currentSheet]);

  const [ignoreRankingColumns] = useState<string[]>(["subData"]);
  const [hideDataColumns, setHideDataColumns] = useState<string[]>(
    localStorage.getItem("hideDataColumns")?.split(",") || ["subData"]
  );

  // Renames for the original data columns
  const [columnRenames, setColumnRenames] = useState<Record<string, string>>(
    JSON.parse(localStorage.getItem("columnRenames") || "{}")
  );

  // Custom columns for the original data
  const [customColumns, setCustomColumns] = useState<Record<string, string>>(
    JSON.parse(localStorage.getItem("customColumns") || "{}")
  );

  // Overrides for column values
  const [columnValueOverrides, setColumnValueOverrides] = useState<Record<string, string>>(
    JSON.parse(localStorage.getItem("columnValueOverrides") || "{}")
  );

  // Separate options for team results
  const [teamColumnRenames, setTeamColumnRenames] = useState<Record<string, string>>(
    JSON.parse(localStorage.getItem("teamColumnRenames") || "{}")
  );

  // Custom columns for team results
  const [teamCustomColumns, setTeamCustomColumns] = useState<Record<string, string>>(
    JSON.parse(localStorage.getItem("teamCustomColumns") || "{}")
  );

  // Overrides for team result columns
  const [teamColumnValueOverrides, setTeamColumnValueOverrides] = useState<Record<string, string>>(
    JSON.parse(localStorage.getItem("teamColumnValueOverrides") || "{}")
  );

  // Columns to hide in team results
  const [teamHideDataColumns, setTeamHideDataColumns] = useState<string[]>(
    localStorage.getItem("teamHideDataColumns")?.split(",") || ["subData"]
  );

  useEffect(() => {
    localStorage.setItem("hideDataColumns", hideDataColumns.join(","));
  }, [hideDataColumns]);

  useEffect(() => {

    localStorage.setItem("columnRenames", JSON.stringify(columnRenames));
  }, [columnRenames]);

  useEffect(() => {

    localStorage.setItem("customColumns", JSON.stringify(customColumns));
  }, [customColumns]);

  useEffect(() => {

    localStorage.setItem("columnValueOverrides", JSON.stringify(columnValueOverrides));
  }, [columnValueOverrides]);

  useEffect(() => {

    localStorage.setItem("teamColumnRenames", JSON.stringify(teamColumnRenames));
  }, [teamColumnRenames]);

  useEffect(() => {

    localStorage.setItem("teamCustomColumns", JSON.stringify(teamCustomColumns));
  }, [teamCustomColumns]);

  useEffect(() => {

    localStorage.setItem("teamColumnValueOverrides", JSON.stringify(teamColumnValueOverrides));
  }, [teamColumnValueOverrides]);

  useEffect(() => {

    localStorage.setItem("teamHideDataColumns", teamHideDataColumns.join(","));
  }, [teamHideDataColumns]);

  useEffect(() => {

    localStorage.setItem("advancedOptionsEnabled", advancedOptionsEnabled.toString());
  }, [advancedOptionsEnabled]);

  const [calculatedScores, setCalculatedScores] =
    useState<ResultDataType>(null);

  const [scorerPerTeam, setScorerPerTeams] = useState<number>(
    parseInt(localStorage.getItem("ParticipantsPerTeams") || "1")
  );

  // Utility functions to calculate configuration indicators
  const getConfigurationIndicators = (
    hideColumns: string[],
    columnRenames: Record<string, string>,
    customColumns: Record<string, string>,
    columnValueOverrides: Record<string, string>,
    defaultHideColumns: string[] = ['subData']
  ) => {
    // Count only hidden columns that are not in the default hidden columns
    const hiddenCount = hideColumns.filter(col => !defaultHideColumns.includes(col)).length;

    // Count only renames that have a non-empty value
    const renameCount = Object.entries(columnRenames).filter(([_, value]) => value && value.trim() !== '').length;

    // Count only custom columns that have a non-empty value
    const customCount = Object.entries(customColumns).filter(([_, value]) => value && value.trim() !== '').length;

    // Count only overrides that have a non-empty value
    const overrideCount = Object.entries(columnValueOverrides).filter(([_, value]) => value && value.trim() !== '').length;

    const totalChanges = hiddenCount + renameCount + customCount + overrideCount;

    return {
      hiddenCount,
      renameCount,
      customCount,
      overrideCount,
      totalChanges,
      hasChanges: totalChanges > 0
    };
  };

  const renderConfigurationBadge = (
    indicators: ReturnType<typeof getConfigurationIndicators>,
    resetFunctions?: {
      resetHideColumns: () => void;
      resetColumnRenames: () => void;
      resetCustomColumns: () => void;
      resetColumnValueOverrides: () => void;
    }
  ) => {
    if (!indicators.hasChanges) {
      return <Tag color="default">Configuration par défaut</Tag>;
    }

    const changes = [];
    if (indicators.hiddenCount > 0) changes.push(`${indicators.hiddenCount} masquée(s)`);
    if (indicators.renameCount > 0) changes.push(`${indicators.renameCount} renommée(s)`);
    if (indicators.customCount > 0) changes.push(`${indicators.customCount} personnalisée(s)`);
    if (indicators.overrideCount > 0) changes.push(`${indicators.overrideCount} modifiée(s)`);

    const handleResetAll = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (resetFunctions) {
        resetFunctions.resetHideColumns();
        resetFunctions.resetColumnRenames();
        resetFunctions.resetCustomColumns();
        resetFunctions.resetColumnValueOverrides();
      }
    };

    return (
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
        <Tag color="blue">{indicators.totalChanges} modification(s)</Tag>
        {changes.length > 0 && changes.map((change, index) => (
          <Tag key={index} color="orange" style={{ fontSize: '0.8em' }}>
            {change}
          </Tag>
        ))}
        {resetFunctions && (
          <Button
            size="small"
            type="text"
            danger
            onClick={handleResetAll}
            style={{ fontSize: '0.8em', padding: '0 8px', height: '22px' }}
          >
            Restaurer
          </Button>
        )}
      </div>
    );
  };

  const totalParticipants = currentSheet?.data?.length;
  const lastPosition = totalParticipants;
  const allHeaders = currentSheet?.headers || [];

  useEffect(() => {

    localStorage.setItem(
      "ParticipantsPerTeams",
      scorerPerTeam.toString()
    );
  }, [scorerPerTeam]);

  // try get from storage as string
  const [scoreCol, setScoreCol] = useState<string>(
    localStorage.getItem("scoreCol") || ""
  );

  // try get from storage as string
  const [teamCol, setTeamCol] = useState<string>(
    localStorage.getItem("teamCol") || ""
  );

  useEffect(() => {

    localStorage.setItem("file", JSON.stringify(file));

    if (file?.sheets && file.sheets.length > 0) {
      const firstSheet = file.sheets[0];

      if (scoreCol === "" && firstSheet.headers && firstSheet.headers.length > 0) {
        setScoreCol(firstSheet.headers[0]);
      }
      if (teamCol === "" && firstSheet.headers && firstSheet.headers.length > 0) {
        setTeamCol(firstSheet.headers[0]);
      }

      setCurrentSheet(firstSheet);
    } else {
      setCurrentSheet({
        sheetName: "",
        data: null,
        headers: [],
      });
    }
  }, [file, scoreCol, teamCol]);

  useEffect(() => {
    localStorage.setItem("scoreCol", scoreCol);
  }, [scoreCol]);

  useEffect(() => {
    localStorage.setItem("teamCol", teamCol);
  }, [teamCol]);
  const uniqueTeams = [
    ...new Set(currentSheet?.data?.map((row: any) => row[teamCol] as string)),
  ];

  function onUpload(file: FileType) {
    setFile(file);
    // Reset loaded configuration when a new file is uploaded
    setCurrentLoadedConfig(null);
  }

  // Fonction pour charger une configuration sauvegardée
  function loadConfiguration(configData: Configuration['data'], fileData?: any, configId?: string) {
    setHideDataColumns(configData.hideDataColumns);
    setColumnRenames(configData.columnRenames);
    setCustomColumns(configData.customColumns);
    setColumnValueOverrides(configData.columnValueOverrides);
    setTeamColumnRenames(configData.teamColumnRenames);
    setTeamCustomColumns(configData.teamCustomColumns);
    setTeamColumnValueOverrides(configData.teamColumnValueOverrides);
    setTeamHideDataColumns(configData.teamHideDataColumns);
    setScorerPerTeams(configData.scorerPerTeam);
    setScoreCol(configData.scoreCol);
    setTeamCol(configData.teamCol);

    // Load the file if it is present in the configuration
    if (fileData) {
      setFile(fileData);
    }

    // Update the currently loaded configuration
    setCurrentLoadedConfig(configId || null);
  }

  // Create the current configuration object
  const currentConfiguration: Configuration['data'] = {
    hideDataColumns,
    columnRenames,
    customColumns,
    columnValueOverrides,
    teamColumnRenames,
    teamCustomColumns,
    teamColumnValueOverrides,
    teamHideDataColumns,
    scorerPerTeam,
    scoreCol,
    teamCol,
  };

  function calculateScores() {
    // check if scoreCol and teamCol are set and are part of the headers
    if (
      !currentSheet?.headers?.includes(scoreCol) ||
      !currentSheet?.headers?.includes(teamCol)
    ) {
      console.log("Erreur, les colonnes de pointage et d'équipe sont requises");
      setScoreCol("");
      setTeamCol("");
      alert(
        "Il semble qu'il y ait eu une erreur, veuillez sélectionner les colonnes de pointage et d'équipe."
      );
      return;
    }

    const scores: any = {};
    const teamsAsString = uniqueTeams as string[];
    // foreach unique teams get the score
    teamsAsString.forEach((team: string) => {
      scores[team] = 0;
      let count = 0;
      currentSheet?.data?.forEach((row: any) => {
        if (
          row[teamCol] === team &&
          (count < scorerPerTeam || scorerPerTeam <= 0)
        ) {
          if (!row[scoreCol]) {
            return;
          }
          scores[team] += parseInt(row[scoreCol]);
          count++;
        }
      });
    });

    const rankedScores = [];
    // find all scores and add them to an array form lowest to highest
    for (const team in scores) {
      const sortedData = currentSheet?.data
        ?.filter((row: any) => row[teamCol] === team)
        .sort((a: any, b: any) => a[scoreCol] - b[scoreCol])
        .slice(0, scorerPerTeam > 0 ? scorerPerTeam : 100000);
      const newScore = {
        rang: -1,
        equipe: team,
        pointage: scores[team],
        membres: sortedData.length,
        subData: sortedData,
      };
      rankedScores.push(newScore);
    }
    rankedScores.forEach((team) => {
      if (team.membres < scorerPerTeam || scorerPerTeam <= 0) {
        // get the difference
        if (scorerPerTeam > 0) {
          const difference = scorerPerTeam - team.membres;
          team.pointage += difference * (lastPosition + 1);

          for (let i = 0; i < difference; i++)
            team.subData.push({
              [teamCol]: team.equipe,
              [scoreCol]: lastPosition + 1,
            });
        }
      }
    });

    // We sort the array by score
    rankedScores.sort((a, b) => a.pointage - b.pointage);
    // Foreach rankedScores we add a rank
    rankedScores.forEach((score, index) => {
      score.rang = index + 1;
    });

    // We get headers from data by getting first row and getting keys
    const headers = Object.keys(rankedScores[0]).filter(
      (header) => ignoreRankingColumns.includes(header) === false
    );

    setCalculatedScores({
      data: rankedScores,
      headers,
    });
  }

  const showGenerateButton = useMemo(() => {
    return !!(scoreCol && teamCol && scoreCol !== teamCol);
  }, [scoreCol, teamCol]);

  // Variables for parameters depending on advanced mode
  const effectiveHideDataColumns = advancedOptionsEnabled ? hideDataColumns : ['subData'];
  const effectiveColumnRenames = advancedOptionsEnabled ? columnRenames : {};
  const effectiveCustomColumns = advancedOptionsEnabled ? customColumns : {};
  const effectiveColumnValueOverrides = advancedOptionsEnabled ? columnValueOverrides : {};

  const effectiveTeamHideDataColumns = advancedOptionsEnabled ? teamHideDataColumns : ['subData'];
  const effectiveTeamColumnRenames = advancedOptionsEnabled ? teamColumnRenames : {};
  const effectiveTeamCustomColumns = advancedOptionsEnabled ? teamCustomColumns : {};
  const effectiveTeamColumnValueOverrides = advancedOptionsEnabled ? teamColumnValueOverrides : {};

  const columnConfigCollapse = () => {
    if (!advancedOptionsEnabled) return null;

    const indicators = getConfigurationIndicators(
      hideDataColumns,
      columnRenames,
      customColumns,
      columnValueOverrides
    );

    const resetFunctions = {
      resetHideColumns: () => setHideDataColumns(['subData']),
      resetColumnRenames: () => setColumnRenames({}),
      resetCustomColumns: () => setCustomColumns({}),
      resetColumnValueOverrides: () => setColumnValueOverrides({})
    };

    return <Collapse
      items={[
        {
          key: 'columns-config',
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span>Configuration des colonnes - Données originales ({allHeaders.length} colonnes disponibles)</span>
              {renderConfigurationBadge(indicators, resetFunctions)}
            </div>
          ),
          children: (
            <div className="column-config-sections">
              <div className="flex col gap-10">
                <div className="section-title">Afficher / Masquer des colonnes</div>
                <div className="flex row gap-10">
                  {allHeaders?.map((header) => {
                    // Checkbox for each header
                    return (
                      <label key={header} className="checkbox">
                        <input
                          type="checkbox"
                          checked={!hideDataColumns.includes(header)}
                          onChange={() => {
                            if (hideDataColumns.includes(header)) {
                              setHideDataColumns(
                                hideDataColumns.filter((h) => h !== header)
                              );
                            } else {
                              setHideDataColumns([...hideDataColumns, header]);
                            }
                          }}
                        />
                        <span>{header}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex col gap-10">
                <div className="section-title">Renommer les colonnes actives</div>
                <div className="help-text" style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
                  💡 Astuces : Utilisez <code>{`{{{value}}}`}</code> pour inclure le nom original ou <code>{`{{{value:0}}}`}</code> pour inclure une autre colonne par index
                </div>
                <div className="columns-index-help" style={{ fontSize: '0.8em', color: '#999', marginBottom: '15px' }}>
                  📋 Index des colonnes : {allHeaders.map((header, index) => `${index}:${header}`).join(', ')}
                </div>
                <div className="rename-columns-grid">
                  {allHeaders?.filter(header => !hideDataColumns.includes(header)).map((header) => {
                    return (
                      <div key={header} className="column-rename-row">
                        <span className="column-name">{header}:</span>
                        <Input
                          placeholder={`Ex: ${header} ou {{{value:0}}} {{{value}}}`}
                          value={columnRenames[header] || ''}
                          onChange={(e) => {
                            const newRenames = { ...columnRenames };
                            if (e.target.value.trim() === '') {
                              delete newRenames[header];
                            } else {
                              newRenames[header] = e.target.value;
                            }
                            setColumnRenames(newRenames);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex col gap-10">
                <div className="section-title">Personnaliser les valeurs des colonnes</div>
                <div className="help-text" style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
                  💡 Modifiez les valeurs affichées. Utilisez <code>{`{{{value}}}`}</code> pour la valeur originale ou <code>{`{{{value:0}}}`}</code> pour une autre colonne
                </div>
                <div className="rename-columns-grid">
                  {allHeaders?.filter(header => !hideDataColumns.includes(header)).map((header) => {
                    return (
                      <div key={header} className="column-rename-row">
                        <span className="column-name">{header}:</span>
                        <Input
                          placeholder={`Ex: {{{value}}} points ou Valeur: {{{value}}}`}
                          value={columnValueOverrides[header] || ''}
                          onChange={(e) => {
                            const newOverrides = { ...columnValueOverrides };
                            if (e.target.value.trim() === '') {
                              delete newOverrides[header];
                            } else {
                              newOverrides[header] = e.target.value;
                            }
                            setColumnValueOverrides(newOverrides);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex col gap-10">
                <div className="section-title">Ajouter des colonnes personnalisées</div>
                <div className="help-text" style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
                  💡 Créez de nouvelles colonnes avec des valeurs personnalisées
                </div>
                <div className="custom-columns-controls" style={{ marginBottom: '15px' }}>
                  <Button
                    type="dashed"
                    onClick={() => {
                      const columnName = prompt("Nom de la nouvelle colonne:");
                      if (columnName && columnName.trim() !== '') {
                        const newCustomColumns = { ...customColumns };
                        newCustomColumns[columnName] = '{{{value}}}';
                        setCustomColumns(newCustomColumns);
                      }
                    }}
                  >
                    + Ajouter une colonne
                  </Button>
                </div>
                <div className="rename-columns-grid">
                  {Object.entries(customColumns).map(([columnName, formula]) => {
                    return (
                      <div key={columnName} className="column-rename-row">
                        <span className="column-name">
                          <Input readOnly value={columnName} onClick={() => {
                            const newName = prompt("Modifier le nom de la colonne:", columnName);
                            if (newName && newName.trim() !== "" && newName !== columnName) {
                              const newCustomColumns = { ...customColumns };
                              newCustomColumns[newName] = newCustomColumns[columnName];
                              delete newCustomColumns[columnName];
                              setCustomColumns(newCustomColumns);
                            }
                          }} />
                        </span>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <Input
                            placeholder={`Ex: Statut: {{{value:0}}}`}
                            value={formula}
                            onChange={(e) => {
                              const newCustomColumns = { ...customColumns };
                              newCustomColumns[columnName] = e.target.value;
                              setCustomColumns(newCustomColumns);
                            }}
                          />
                          <Button
                            danger
                            size="small"
                            onClick={() => {
                              const newCustomColumns = { ...customColumns };
                              delete newCustomColumns[columnName];
                              setCustomColumns(newCustomColumns);
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <FileTable
                  id="original-sheet-table"
                  sheet={{ ...currentSheet, data: currentSheet?.data?.length > 0 ? [currentSheet.data[0]] : [] }}
                  ignoreColumns={effectiveHideDataColumns}
                  columnRenames={effectiveColumnRenames}
                  customColumns={effectiveCustomColumns}
                  columnValueOverrides={effectiveColumnValueOverrides}
                />
              </div>
            </div>
          ),
        },
      ]}
    />
  }

  const teamColumnConfigCollapse = () => {
    if (!advancedOptionsEnabled) return null;

    const teamHeaders = calculatedScores?.headers || [];
    const indicators = getConfigurationIndicators(
      teamHideDataColumns,
      teamColumnRenames,
      teamCustomColumns,
      teamColumnValueOverrides
    );

    const resetFunctions = {
      resetHideColumns: () => setTeamHideDataColumns(['subData']),
      resetColumnRenames: () => setTeamColumnRenames({}),
      resetCustomColumns: () => setTeamCustomColumns({}),
      resetColumnValueOverrides: () => setTeamColumnValueOverrides({})
    };

    return <Collapse
      items={[
        {
          key: 'team-columns-config',
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span>Configuration des colonnes - Résultats d'équipe ({teamHeaders.length} colonnes disponibles)</span>
              {renderConfigurationBadge(indicators, resetFunctions)}
            </div>
          ),
          children: (
            <div className="column-config-sections">
              <div className="flex col gap-10">
                <div className="section-title">Afficher / Masquer des colonnes</div>
                <div className="flex row gap-10">
                  {teamHeaders?.filter(header => header !== "subData").map((header) => {
                    return (
                      <label key={header} className="checkbox">
                        <input
                          type="checkbox"
                          checked={!teamHideDataColumns.includes(header)}
                          onChange={() => {
                            if (teamHideDataColumns.includes(header)) {
                              setTeamHideDataColumns(
                                teamHideDataColumns.filter((h) => h !== header)
                              );
                            } else {
                              setTeamHideDataColumns([...teamHideDataColumns, header]);
                            }
                          }}
                        />
                        <span>{header}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex col gap-10">
                <div className="section-title">Renommer les colonnes actives</div>
                <div className="help-text" style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
                  💡 Astuces : Utilisez <code>{`{{{value}}}`}</code> pour inclure le nom original ou <code>{`{{{value:0}}}`}</code> pour inclure une autre colonne par index
                </div>
                <div className="columns-index-help" style={{ fontSize: '0.8em', color: '#999', marginBottom: '15px' }}>
                  📋 Index des colonnes : {teamHeaders.filter(header => header !== "subData").map((header, index) => `${index}:${header}`).join(', ')}
                </div>
                <div className="rename-columns-grid">
                  {teamHeaders?.filter(header => !teamHideDataColumns.includes(header) && header !== "subData").map((header) => {
                    return (
                      <div key={header} className="column-rename-row">
                        <span className="column-name">{header}:</span>
                        <Input
                          placeholder={`Ex: ${header} ou {{{value:0}}} {{{value}}}`}
                          value={teamColumnRenames[header] || ''}
                          onChange={(e) => {
                            const newRenames = { ...teamColumnRenames };
                            if (e.target.value.trim() === '') {
                              delete newRenames[header];
                            } else {
                              newRenames[header] = e.target.value;
                            }
                            setTeamColumnRenames(newRenames);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex col gap-10">
                <div className="section-title">Personnaliser les valeurs des colonnes</div>
                <div className="help-text" style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
                  💡 Modifiez les valeurs affichées. Utilisez <code>{`{{{value}}}`}</code> pour la valeur originale ou <code>{`{{{value:0}}}`}</code> pour une autre colonne
                </div>
                <div className="rename-columns-grid">
                  {teamHeaders?.filter(header => !teamHideDataColumns.includes(header) && header !== "subData").map((header) => {
                    return (
                      <div key={header} className="column-rename-row">
                        <span className="column-name">{header}:</span>
                        <Input
                          placeholder={`Ex: {{{value}}} points ou Valeur: {{{value}}}`}
                          value={teamColumnValueOverrides[header] || ''}
                          onChange={(e) => {
                            const newOverrides = { ...teamColumnValueOverrides };
                            if (e.target.value.trim() === '') {
                              delete newOverrides[header];
                            } else {
                              newOverrides[header] = e.target.value;
                            }
                            setTeamColumnValueOverrides(newOverrides);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex col gap-10">
                <div className="section-title">Ajouter des colonnes personnalisées</div>
                <div className="help-text" style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
                  💡 Créez de nouvelles colonnes avec des valeurs personnalisées
                </div>
                <div className="custom-columns-controls" style={{ marginBottom: '15px' }}>
                  <Button
                    type="dashed"
                    onClick={() => {
                      const columnName = prompt("Nom de la nouvelle colonne:");
                      if (columnName && columnName.trim() !== '') {
                        const newCustomColumns = { ...teamCustomColumns };
                        newCustomColumns[columnName] = '{{{value}}}';
                        setTeamCustomColumns(newCustomColumns);
                      }
                    }}
                  >
                    + Ajouter une colonne
                  </Button>
                </div>
                <div className="rename-columns-grid">
                  {Object.entries(teamCustomColumns).map(([columnName, formula]) => {
                    return (
                      <div key={columnName} className="column-rename-row">
                        <span className="column-name">
                          <Input
                            readOnly
                            value={columnName}
                            onClick={() => {
                              const newName = prompt("Modifier le nom de la colonne:", columnName);
                              if (newName && newName.trim() !== "" && newName !== columnName) {
                                const newCustomColumns = { ...teamCustomColumns };
                                newCustomColumns[newName] = newCustomColumns[columnName];
                                delete newCustomColumns[columnName];
                                setTeamCustomColumns(newCustomColumns);
                              }
                            }}
                          />
                        </span>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <Input
                            placeholder={`Ex: Statut: {{{value:0}}}`}
                            value={formula}
                            onChange={(e) => {
                              const newCustomColumns = { ...teamCustomColumns };
                              newCustomColumns[columnName] = e.target.value;
                              setTeamCustomColumns(newCustomColumns);
                            }}
                          />
                          <Button
                            danger
                            size="small"
                            onClick={() => {
                              const newCustomColumns = { ...teamCustomColumns };
                              delete newCustomColumns[columnName];
                              setTeamCustomColumns(newCustomColumns);
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ),
        },
      ]}
    />
  }

  return (
    <div className="page team-scores">
      <div id="page-header" className="flex col gap-10">
        <img src={logo} alt="logo" />
        <h1 className="title">Générateur de résultats</h1>
      </div>
      <div className="advanced-options-toggle">
        <div className="flex col gap-10">
          <Button.Group>
            <Button
              type={!advancedOptionsEnabled ? "primary" : "default"}
              onClick={() => setAdvancedOptionsEnabled(false)}
            >
              Simple
            </Button>
            <Button
              type={advancedOptionsEnabled ? "primary" : "default"}
              onClick={() => setAdvancedOptionsEnabled(true)}
            >
              Avancé
            </Button>
          </Button.Group>
          {/* <span style={{ fontSize: '0.9em', color: '#666' }}>
              {advancedOptionsEnabled
                ? "Mode avancé - Options de configuration et personnalisation disponibles"
                : "Mode simplifié - Seules les options de base sont disponibles"
              }
            </span> */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {advancedOptionsEnabled ? (
              <Card type="inner" className="advanced-info-box" style={{ background: "#f6faff", borderColor: "#dbeafe", marginBottom: 10 }}>
                <div style={{ fontSize: "1em", color: "#2563eb" }}>
                  <b>Mode avancé</b>
                  <div style={{ margin: "8px 0 0 18px", color: "#222" }}>
                    📝 Personnalisation des noms des colonnes,<br />
                    ✏️ modification des valeurs affichées dans les colonnes,<br />
                    ➕ ajout de colonnes personnalisées,<br />
                    👁️ masquage ou affichage des colonnes,<br />
                    💾 sauvegarde et rechargement des configurations.
                  </div>
                </div>
              </Card>
            ) : (
              <Card type="inner" className="advanced-info-box" style={{ background: "#f6faff", borderColor: "#dbeafe", marginBottom: 10 }}>
                <div style={{ fontSize: "1em", color: "#2563eb" }}>
                  <b>Mode simplifié</b>
                  <div style={{ margin: "8px 0 0 18px", color: "#222" }}>
                    📁 Importation d'un fichier,<br />
                    📊 sélection des colonnes de pointage et d'équipe,<br />
                    🏆 génération des résultats.
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Divider />
      <Card title="Données importées" className="file-management-card">
        <div className="file-management-section">
          <div className="management-actions">
            <div className="upload-section">
              <h4>Importation de fichier</h4>
              <FileUploader onUpload={onUpload} defaultFile={file} />
            </div>
            {advancedOptionsEnabled && (
              <>
                <Divider>OU</Divider>
                <div className="config-load-section">
                  <h4>Charger une configuration</h4>
                  <ConfigurationLoader onConfigurationLoad={loadConfiguration} />
                </div>
              </>
            )}
          </div>
        </div>

        {file && (
          <>
            <Divider />
            <div className="file-info-section">
              <Collapse
                items={[
                  {
                    key: 'file-details',
                    label: `Détails du fichier importé (${file.cleanName}.${file.extension})`,
                    children: (
                      <div className="flex col gap-5">
                        <span className="flex row gap-5">
                          <b>Nom du fichier: </b>
                          <span>{file.name}</span>
                        </span>
                        <span className="flex row gap-5">
                          <b>Fichier: </b>
                          <span>{file.cleanName}</span>
                          <span>.</span>
                          <span>{file.extension}</span>
                          <span>({file.formattedSize})</span>
                        </span>
                        <span className="file-detail">
                          <b >Nombre d'entrées: </b>
                          <span >{totalParticipants}</span>
                        </span>
                        {uniqueTeams && (
                          <span className="file-detail">
                            <b >Nombre d'équipes: </b>
                            <span >{uniqueTeams.length}</span>
                          </span>
                        )}
                        <Button
                          danger
                          type="link"
                          onClick={() => {
                            setFile(null);
                            setCalculatedScores(null);
                          }}
                        >
                          Retirer le fichier importé <FileXIcon size={22} />
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            </div>

            <Divider />
            <div className="sheet-selection-section">
              <div className="file-sheets">
                <span>Sélectionnez une feuille</span>
                <div className="sheets">
                  {file?.sheets?.map((sheet: SheetData) => {
                    return (
                      <Button
                        key={sheet.sheetName}
                        className={`${currentSheet === sheet ? "selected" : ""
                          }`}
                        onClick={() => {
                          setCurrentSheet(sheet);
                        }}
                      >
                        {sheet.sheetName}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {currentSheet?.sheetName && (
                <>
                  {/* <Divider /> */}
                  {/* <div className="columns-section">
                    {columnConfigCollapse()}
                  </div> */}
                  <Divider />
                  <div className="sheet-data-section">
                    <Collapse
                      items={[
                        {
                          key: '1',
                          label: `Données de "${currentSheet.sheetName}" (${totalParticipants} entrées)`,
                          children: (
                            <FileTable
                              id="original-sheet-table"
                              sheet={currentSheet}
                              ignoreColumns={effectiveHideDataColumns}
                              columnRenames={effectiveColumnRenames}
                              customColumns={effectiveCustomColumns}
                              columnValueOverrides={effectiveColumnValueOverrides}
                            />
                          ),
                        },
                      ]}
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </Card>

      {file && (
        <>
          <Card title="Génération des résultats" className="config-actions-card">
            <div className="config-section">
              {advancedOptionsEnabled && (
                <>
                  <div className="configuration-manager-section">
                    <h4>Sauvegarde de la configuration</h4>
                    <ConfigurationSaver
                      currentConfig={currentConfiguration}
                      currentFile={file}
                      currentLoadedConfigId={currentLoadedConfig}
                      loadConfiguration={(config) => {
                        loadConfiguration(config.data, config.file, config.id);
                      }}
                    />
                  </div>
                  <Divider />
                </>
              )}
              <div className="flex row gap-20">
                <div className="flex col gap-10">
                  <span>Colonne de pointage</span>
                  <Select
                    value={scoreCol}
                    onChange={setScoreCol}
                    placeholder="Sélectionnez une colonne"
                    style={{ width: 200 }}
                    options={currentSheet?.headers?.map(header => ({
                      value: header,
                      label: header
                    })) || []}
                  />
                </div>
                <div className="flex col gap-10">
                  <span>Colonne de l'équipe</span>
                  <Select
                    value={teamCol}
                    onChange={setTeamCol}
                    placeholder="Sélectionnez une colonne"
                    style={{ width: 200 }}
                    options={currentSheet?.headers?.map(header => ({
                      value: header,
                      label: header
                    })) || []}
                  />
                </div>
                <div className="flex col gap-10">
                  <span>Participants par équipe </span>
                  <Input
                    type="number"
                    value={scorerPerTeam}
                    onChange={(e) => {
                      const value =
                        parseInt(e.target.value) >= 0
                          ? parseInt(e.target.value)
                          : 0;
                      setScorerPerTeams(value);
                    }}
                  />
                </div>
              </div>
            </div>
            {columnConfigCollapse()}
            {advancedOptionsEnabled && <Divider />}
            <div className="actions-section">
              <div className="flex col gap-10">
                <Checkbox checked={capitalizeColumns} onChange={(e) => setCapitalizeColumns(e.target.checked)}>
                  Faire commencer les noms de colonnes par une majuscule
                </Checkbox>
                {showGenerateButton && (
                  <>
                    <Button
                      className="w-content"
                      size="large"
                      type="primary"
                      onClick={() => calculateScores()}>
                      Générer le classement <TableIcon size={25} />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>

          {calculatedScores && (
            <Card title="Résultats" className="ranking-card">
              <div className="flex row gap-10 mb-10" >
                <Button
                  type="primary"
                  onClick={() => {
                    // Utility to normalize string: replace spaces with '-', lowercase, remove accents
                    const normalize = (str: string) =>
                      str
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "") // Remove accents
                        .replace(/\s+/g, "-") // Replace spaces with '-'
                        .toLowerCase();

                    exportToCsv(
                      calculatedScores,
                      "classement_" + normalize(currentSheet.sheetName),
                      {
                        ignoreColumns: effectiveTeamHideDataColumns,
                        columnRenames: effectiveTeamColumnRenames,
                        customColumns: effectiveTeamCustomColumns,
                        columnValueOverrides: effectiveTeamColumnValueOverrides,
                        capitalizeColumns: capitalizeColumns
                      }
                    );
                  }}
                >
                  Télécharger le classement <FileArrowDownIcon size={22} />
                </Button>
                <Button
                  danger
                  type="link"
                  onClick={() => {
                    setCalculatedScores(null);
                  }}
                >
                  Réinitialiser le classement <TrashIcon size={15} />
                </Button>
              </div>
              <div className="team-config-section">
                {teamColumnConfigCollapse()}
              </div>
              {advancedOptionsEnabled && <Divider />}
              <FileTable
                id="team-scores-table"
                data={calculatedScores.data}
                ignoreColumns={effectiveTeamHideDataColumns}
                columnRenames={effectiveTeamColumnRenames}
                customColumns={effectiveTeamCustomColumns}
                columnValueOverrides={effectiveTeamColumnValueOverrides}
                capitalizeColumns={capitalizeColumns}
                renderSubData={(subData, index) => (
                  <FileTable
                    id={`team-scores-sub-table_${index}`}
                    data={subData}
                    title="Contributeurs"
                    showComplete={true}
                    ignoreColumns={effectiveHideDataColumns}
                    columnRenames={effectiveColumnRenames}
                    customColumns={effectiveCustomColumns}
                    columnValueOverrides={effectiveColumnValueOverrides}
                  />
                )}
              />
            </Card>
          )}

        </>
      )}
    </div>
  );
}
