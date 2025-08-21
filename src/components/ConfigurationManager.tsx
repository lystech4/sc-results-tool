/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Button, Modal, Input, Select, message, Popconfirm } from 'antd';
import { SaveOutlined, DeleteOutlined, HistoryOutlined } from '@ant-design/icons';
import "./ConfigurationManager.scss";

export type Configuration = {
    id: string;
    name: string;
    fileName: string;
    timestamp: number;
    file: {
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
        sheets?: any[];
        // On ne peut pas sauvegarder l'objet File directement, on le reconstruit
        fileData?: string; // Base64 ou données sérialisées
    } | null;
    data: {
        hideDataColumns: string[];
        columnRenames: Record<string, string>;
        customColumns: Record<string, string>;
        columnValueOverrides: Record<string, string>;
        teamColumnRenames: Record<string, string>;
        teamCustomColumns: Record<string, string>;
        teamColumnValueOverrides: Record<string, string>;
        teamHideDataColumns: string[];
        scorerPerTeam: number;
        scoreCol: string;
        teamCol: string;
    };
};

type ConfigurationSaverProps = {
    currentConfig: Configuration['data'];
    currentFile?: any; // FileType
    currentLoadedConfigId?: string | null; // ID de la configuration actuellement chargée
    loadConfiguration?: (config: Configuration) => void;
};

type ConfigurationLoaderProps = {
    onConfigurationLoad: (config: Configuration['data'], file?: any, configId?: string) => void;
};

const STORAGE_KEY = 'race-team-configurations';

// Event personnalisé pour synchroniser les composants
const CONFIGURATION_CHANGED_EVENT = 'configurationChanged';

// Composant pour sauvegarder les configurations
export function ConfigurationSaver({ currentConfig, currentFile, currentLoadedConfigId, loadConfiguration }: ConfigurationSaverProps) {
    const [configurations, setConfigurations] = useState<Configuration[]>([]);
    const [saveModalVisible, setSaveModalVisible] = useState(false);
    const [configurationName, setConfigurationName] = useState('');
    const [fileName, setFileName] = useState(currentFile?.name || '');
    const [loading, setLoading] = useState(false);

    // États pour la modal de confirmation d'écrasement
    const [confirmOverwriteVisible, setConfirmOverwriteVisible] = useState(false);
    const [pendingOverwriteConfig, setPendingOverwriteConfig] = useState<Configuration | null>(null);

    // Charger les configurations depuis localStorage
    useEffect(() => {
        loadConfigurations();
    }, []);

    // Mettre à jour le nom du fichier quand il change
    useEffect(() => {
        setFileName(currentFile?.name || '');
    }, [currentFile]);

    const loadConfigurations = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed: Configuration[] = JSON.parse(stored);
                setConfigurations(parsed.sort((a, b) => b.timestamp - a.timestamp));
            }
        } catch (error) {
            console.error('Erreur lors du chargement des configurations:', error);
        }
    };

    const performSave = async (configToOverwrite?: Configuration) => {
        setLoading(true);
        try {
            // Préparer les données du fichier pour la sauvegarde
            let fileForSave: any = null;
            if (currentFile) {
                // Convertir le fichier en base64 pour la sauvegarde
                let fileData: string | undefined = undefined;
                if (currentFile.file) {
                    try {
                        const reader = new FileReader();
                        fileData = await new Promise<string>((resolve, reject) => {
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsDataURL(currentFile.file);
                        });
                    } catch (error) {
                        console.warn('Impossible de sauvegarder les données du fichier:', error);
                    }
                }

                fileForSave = {
                    name: currentFile.name,
                    cleanName: currentFile.cleanName,
                    type: currentFile.type,
                    size: currentFile.size,
                    kbSize: currentFile.kbSize,
                    mbSize: currentFile.mbSize,
                    gbSize: currentFile.gbSize,
                    formattedSize: currentFile.formattedSize,
                    lastModified: currentFile.lastModified,
                    lastModifiedDate: currentFile.lastModifiedDate,
                    webkitRelativePath: currentFile.webkitRelativePath,
                    extension: currentFile.extension,
                    sheets: currentFile.sheets,
                    fileData: fileData // Données en base64
                };
            }

            let updatedConfigurations: Configuration[];

            if (configToOverwrite) {
                // Écraser la configuration existante
                updatedConfigurations = configurations.map(c =>
                    c.id === configToOverwrite.id ? {
                        ...configToOverwrite,
                        name: configurationName.trim() || configToOverwrite.name,
                        fileName: fileName.trim() || currentFile?.name || 'Fichier non spécifié',
                        timestamp: Date.now(),
                        file: fileForSave,
                        data: { ...currentConfig }
                    } : c
                );
                message.success(`Configuration "${configToOverwrite.name}" mise à jour avec succès`);
            } else {
                // Créer une nouvelle configuration
                const newConfig: Configuration = {
                    id: Date.now().toString(),
                    name: configurationName.trim(),
                    fileName: fileName.trim() || currentFile?.name || 'Fichier non spécifié',
                    timestamp: Date.now(),
                    file: fileForSave,
                    data: { ...currentConfig }
                };
                updatedConfigurations = [...configurations, newConfig];
                message.success(`Configuration "${configurationName}" sauvegardée avec succès`);
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfigurations));
            setConfigurations(updatedConfigurations.sort((a, b) => b.timestamp - a.timestamp));

            // Déclencher l'événement pour notifier les autres composants
            window.dispatchEvent(new CustomEvent(CONFIGURATION_CHANGED_EVENT));

            setSaveModalVisible(false);
            setConfigurationName('');
            setConfirmOverwriteVisible(false);
            setPendingOverwriteConfig(null);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            message.error('Erreur lors de la sauvegarde de la configuration');
        } finally {
            setLoading(false);
        }
    };

    const saveConfiguration = async () => {
        if (!configurationName.trim()) {
            if (fileName.trim()) {
                setConfigurationName(fileName.trim());
            } else {
                message.error('Veuillez entrer un nom pour la configuration');
                return;
            }
        }

        // Vérifier si on a une configuration chargée avec le même fichier
        if (currentLoadedConfigId && currentFile) {
            const loadedConfig = configurations.find(c => c.id === currentLoadedConfigId);
            if (loadedConfig && loadedConfig.file && currentFile.name === loadedConfig.file.name) {
                // On a une configuration chargée avec le même fichier, demander confirmation
                setPendingOverwriteConfig(loadedConfig);
                setConfirmOverwriteVisible(true);
                return;
            }
        }

        // Vérifier si une configuration avec le même nom existe déjà
        const existingConfig = configurations.find(c => c.name === configurationName.trim());
        if (existingConfig) {
            setPendingOverwriteConfig(existingConfig);
            setConfirmOverwriteVisible(true);
            return;
        }

        // Procéder à la sauvegarde normale
        await performSave();
    };

    const confirmOverwrite = async () => {
        if (!pendingOverwriteConfig) return;
        await performSave(pendingOverwriteConfig);
    };

    const saveAsNew = async () => {
        setConfirmOverwriteVisible(false);
        setPendingOverwriteConfig(null);
        // Générer un nom unique en ajoutant un suffixe
        const baseName = configurationName.trim();
        let counter = 1;
        let uniqueName = `${baseName} (${counter})`;
        while (configurations.find(c => c.name === uniqueName)) {
            counter++;
            uniqueName = `${baseName} (${counter})`;
        }
        setConfigurationName(uniqueName);
        await performSave();
    };

    const deleteConfiguration = async (configId: string) => {
        try {
            const updatedConfigurations = configurations.filter(c => c.id !== configId);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfigurations));
            setConfigurations(updatedConfigurations);

            // Déclencher l'événement pour notifier les autres composants
            window.dispatchEvent(new CustomEvent(CONFIGURATION_CHANGED_EVENT));

            const deletedConfig = configurations.find(c => c.id === configId);
            message.success(`Configuration "${deletedConfig?.name}" supprimée avec succès`);
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            message.error('Erreur lors de la suppression de la configuration');
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getConfirmationMessage = () => {
        if (currentLoadedConfigId && pendingOverwriteConfig?.id === currentLoadedConfigId) {
            return (
                <div>
                    <p>Vous avez actuellement la configuration <strong>"{pendingOverwriteConfig.name}"</strong> chargée avec le même fichier.</p>
                    <p>Voulez-vous :</p>
                    <ul>
                        <li>Mettre à jour cette configuration existante</li>
                        <li>Créer une nouvelle configuration</li>
                    </ul>
                </div>
            );
        } else {
            return (
                <div>
                    <p>Une configuration avec le nom <strong>"{pendingOverwriteConfig?.name}"</strong> existe déjà.</p>
                    <p>Voulez-vous l'écraser ou créer une nouvelle configuration ?</p>
                </div>
            );
        }
    };

    return (
        <div className="configuration-saver">
            <div className="configuration-actions">
                <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={() => setSaveModalVisible(true)}
                    size="small"
                    title="Sauvegarder la configuration actuelle pour pouvoir la réutiliser plus tard"
                >
                    Sauvegarder la configuration
                </Button>
            </div>

            {configurations.length > 0 && (
                <div className="saved-configurations">
                    <h5>Configurations sauvegardées ({configurations.length})</h5>
                    <div className="configurations-list">
                        {configurations.map(config => {
                            const isCurrent = currentLoadedConfigId === config.id;

                            return <div key={config.id} className={`configuration-item ${isCurrent ? 'current' : ''}`} onClick={() => {
                                if (!isCurrent) {
                                    // Charger la configuration sélectionnée
                                    if (loadConfiguration) {
                                        loadConfiguration(config);
                                    }
                                }
                            }}>
                                <div className="config-info">
                                    <div className="config-name">
                                        {config.name}
                                        {isCurrent && (
                                            <span className="current-config-badge"> (Actuelle)</span>
                                        )}
                                    </div>
                                    <div className="config-details">
                                        <span className="config-filename">{config.fileName}</span>
                                        <span className="config-date">{formatDate(config.timestamp)}</span>
                                    </div>
                                </div>
                                <div className="config-actions">
                                    <Popconfirm
                                        title="Supprimer cette configuration ?"
                                        description="Cette action est irréversible."
                                        onConfirm={() => deleteConfiguration(config.id)}
                                        okText="Supprimer"
                                        cancelText="Annuler"
                                    >
                                        <Button
                                            type="text"
                                            icon={<DeleteOutlined />}
                                            size="small"
                                            danger
                                        />
                                    </Popconfirm>
                                </div>
                            </div>
                        })}
                    </div>
                </div>
            )}

            {/* Modal de sauvegarde */}
            <Modal
                title="Sauvegarder la configuration"
                open={saveModalVisible}
                onOk={saveConfiguration}
                onCancel={() => {
                    setSaveModalVisible(false);
                    setConfigurationName('');
                }}
                confirmLoading={loading}
                okText="Sauvegarder"
                cancelText="Annuler"
            >
                <div className="save-modal-content">
                    <div className="form-field">
                        <label>Nom de la configuration *</label>
                        <Input
                            placeholder="Ex: Configuration équipe A, Setup tournoi, etc."
                            value={configurationName}
                            onChange={(e) => setConfigurationName(e.target.value)}
                            onPressEnter={saveConfiguration}
                            maxLength={50}
                        />
                    </div>
                    <div className="form-field">
                        <label>Nom du fichier associé</label>
                        <Input
                            placeholder="Ex: resultats_competition.xlsx"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            maxLength={100}
                        />
                    </div>
                </div>
            </Modal>

            {/* Modal de confirmation d'écrasement */}
            <Modal
                title="Configuration existante détectée"
                open={confirmOverwriteVisible}
                footer={[
                    <Button key="cancel" onClick={() => setConfirmOverwriteVisible(false)}>
                        Annuler
                    </Button>,
                    <Button key="new" onClick={saveAsNew}>
                        Créer une nouvelle configuration
                    </Button>,
                    <Button key="overwrite" type="primary" onClick={confirmOverwrite} loading={loading}>
                        {currentLoadedConfigId && pendingOverwriteConfig?.id === currentLoadedConfigId ?
                            'Mettre à jour' : 'Écraser'
                        }
                    </Button>
                ]}
            >
                {getConfirmationMessage()}
            </Modal>
        </div>
    );
}

// Composant pour charger les configurations
export function ConfigurationLoader({ onConfigurationLoad }: ConfigurationLoaderProps) {
    const [configurations, setConfigurations] = useState<Configuration[]>([]);
    const [selectedConfigId, setSelectedConfigId] = useState<string>('');

    // Charger les configurations depuis localStorage
    useEffect(() => {
        loadConfigurations();

        // Écouter les changements de configuration
        const handleConfigurationChange = () => {
            loadConfigurations();
        };

        window.addEventListener(CONFIGURATION_CHANGED_EVENT, handleConfigurationChange);

        return () => {
            window.removeEventListener(CONFIGURATION_CHANGED_EVENT, handleConfigurationChange);
        };
    }, []);

    const loadConfigurations = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed: Configuration[] = JSON.parse(stored);
                setConfigurations(parsed.sort((a, b) => b.timestamp - a.timestamp));
            }
        } catch (error) {
            console.error('Erreur lors du chargement des configurations:', error);
        }
    };

    const loadConfiguration = async () => {
        if (!selectedConfigId) {
            message.error('Veuillez sélectionner une configuration');
            return;
        }

        try {
            const config = configurations.find(c => c.id === selectedConfigId);
            if (!config) {
                message.error('Configuration non trouvée');
                return;
            }

            // Préparer le fichier pour le chargement
            let fileToLoad = null;
            if (config.file) {
                // Essayer de recréer l'objet File à partir des données base64
                let recreatedFile = null;
                if (config.file.fileData) {
                    try {
                        // Convertir les données base64 en Blob puis en File
                        const response = await fetch(config.file.fileData);
                        const blob = await response.blob();
                        recreatedFile = new File([blob], config.file.name, {
                            type: config.file.type,
                            lastModified: config.file.lastModified
                        });
                    } catch (error) {
                        console.warn('Impossible de recréer le fichier à partir des données base64:', error);
                    }
                }

                fileToLoad = {
                    ...config.file,
                    file: recreatedFile // Objet File recréé ou null si échec
                };
            }

            onConfigurationLoad(config.data, fileToLoad, config.id);
            message.success(`Configuration "${config.name || config.fileName}" chargée avec succès`);
            setSelectedConfigId('');
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            message.error('Erreur lors du chargement de la configuration');
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (configurations.length === 0) {
        return (
            <div className="configuration-loader">
                <div className="no-configurations">
                    <span>Aucune configuration sauvegardée</span>
                </div>
            </div>
        );
    }

    return (
        <div className="configuration-loader">
            <div className="config-load-section">
                <Select
                    placeholder="Choisir une configuration..."
                    value={selectedConfigId || undefined}
                    onChange={setSelectedConfigId}
                    style={{ width: 280 }}
                >
                    {configurations.map(config => (
                        <Select.Option key={config.id} value={config.id}>
                            <div className="config-option">
                                <div className="config-name">
                                    {config.name}
                                </div>
                                {/* <div className="config-details">
                                    <span className="config-filename">{config.fileName}</span>
                                    <span className="config-date">{formatDate(config.timestamp)}</span>
                                </div> */}
                            </div>
                        </Select.Option>
                    ))}
                </Select>
                <Button
                    type="primary"
                    icon={<HistoryOutlined />}
                    onClick={loadConfiguration}
                    disabled={!selectedConfigId}
                    size="small"
                >
                    Charger
                </Button>
            </div>
            {selectedConfigId && (
                <div className="selected-config-details">
                    {(() => {
                        const config = configurations.find(c => c.id === selectedConfigId);
                        if (!config) return null;
                        return (
                            <div>
                                <h5>Détails de la configuration sélectionnée</h5>
                                <div><strong>Nom:</strong> {config.name}</div>
                                <div><strong>Fichier:</strong> {config.fileName}</div>
                                <div><strong>Date:</strong> {formatDate(config.timestamp)}</div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}

export default function ConfigurationManager({
    currentConfig,
    onConfigurationLoad
}: ConfigurationSaverProps & ConfigurationLoaderProps) {
    return (
        <div className="configuration-manager">
            <div className="config-actions">
                <ConfigurationLoader onConfigurationLoad={onConfigurationLoad} />
                <ConfigurationSaver currentConfig={currentConfig} />
            </div>
        </div>
    );
}
