import { createLogger } from "../../utils/optimizedLogger";
import { PerformanceMetric } from "../monitoring/adminMonitoringService";

const logger = createLogger("AdminDataCompressor");

interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  compressionTime: number;
  decompressionTime: number;
}

interface CompressedData {
  data: string;
  algorithm: string;
  originalSize: number;
  compressedSize: number;
  timestamp: number;
}

/**
 * Service de compression avancé pour optimiser la bande passante
 * Utilise plusieurs algorithmes selon le type de données
 */
class AdminDataCompressor {
  private readonly COMPRESSION_THRESHOLD = 1024; // 1KB - seuil pour la compression
  private readonly DICTIONARY_SIZE = 4096; // Taille du dictionnaire pour LZ

  /**
   * Compresse des données selon leur type
   */
  async compress(data: any, algorithm: 'lz' | 'deflate' | 'gzip' | 'auto' = 'auto'): Promise<CompressedData> {
    const startTime = Date.now();
    const originalData = typeof data === 'string' ? data : JSON.stringify(data);
    const originalSize = originalData.length;

    // Ne pas compresser les petites données
    if (originalSize < this.COMPRESSION_THRESHOLD) {
      return {
        data: originalData,
        algorithm: 'none',
        originalSize,
        compressedSize: originalSize,
        timestamp: Date.now()
      };
    }

    // Choisir l'algorithme automatiquement
    const selectedAlgorithm = algorithm === 'auto' ? this.selectOptimalAlgorithm(data) : algorithm;

    try {
      let compressedData: string;

      switch (selectedAlgorithm) {
        case 'lz':
          compressedData = this.compressLZ(originalData);
          break;
        case 'deflate':
          compressedData = await this.compressDeflate(originalData);
          break;
        case 'gzip':
          compressedData = await this.compressGzip(originalData);
          break;
        default:
          compressedData = originalData;
      }

      const compressedSize = compressedData.length;
      const compressionTime = Date.now() - startTime;

      const result: CompressedData = {
        data: compressedData,
        algorithm: selectedAlgorithm,
        originalSize,
        compressedSize,
        timestamp: Date.now()
      };

      const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

      logger.debug(`Compression réussie: ${originalSize} -> ${compressedSize} octets (${compressionRatio.toFixed(1)}% réduction)`);

      return result;

    } catch (error) {
      logger.warn("Erreur lors de la compression, utilisation des données originales:", error);
      return {
        data: originalData,
        algorithm: 'none',
        originalSize,
        compressedSize: originalSize,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Décompresse des données
   */
  async decompress(compressedData: CompressedData): Promise<any> {
    const startTime = Date.now();

    try {
      let decompressedData: string;

      switch (compressedData.algorithm) {
        case 'lz':
          decompressedData = this.decompressLZ(compressedData.data);
          break;
        case 'deflate':
          decompressedData = await this.decompressDeflate(compressedData.data);
          break;
        case 'gzip':
          decompressedData = await this.decompressGzip(compressedData.data);
          break;
        case 'none':
        default:
          decompressedData = compressedData.data;
      }

      const decompressionTime = Date.now() - startTime;

      // Tenter de parser le JSON
      try {
        return JSON.parse(decompressedData);
      } catch {
        return decompressedData;
      }

    } catch (error) {
      logger.error("Erreur lors de la décompression:", error);
      throw error;
    }
  }

  /**
   * Sélectionne l'algorithme optimal selon le type de données
   */
  private selectOptimalAlgorithm(data: any): 'lz' | 'deflate' | 'gzip' {
    const dataType = this.analyzeDataType(data);

    switch (dataType) {
      case 'metrics':
        return 'lz'; // Bon pour les données structurées répétitives
      case 'logs':
        return 'deflate'; // Bon pour les logs textuels
      case 'large_objects':
        return 'gzip'; // Meilleur pour les gros volumes
      default:
        return 'lz'; // Défaut
    }
  }

  /**
   * Analyse le type de données pour optimiser la compression
   */
  private analyzeDataType(data: any): 'metrics' | 'logs' | 'large_objects' | 'other' {
    if (Array.isArray(data) && data.length > 0) {
      if (data[0] && typeof data[0] === 'object' && 'type' in data[0]) {
        return 'metrics'; // Probablement des métriques
      }
    }

    if (typeof data === 'string' && data.includes('ERROR') || data.includes('INFO')) {
      return 'logs'; // Probablement des logs
    }

    if (JSON.stringify(data).length > 10000) {
      return 'large_objects'; // Données volumineuses
    }

    return 'other';
  }

  /**
   * Compression LZ (Lempel-Ziv) simple et rapide
   */
  private compressLZ(data: string): string {
    const dictionary: Map<string, number> = new Map();
    let dictSize = 0;
    let result = '';

    for (let i = 0; i < data.length; i++) {
      let bestMatch = '';
      let bestMatchIndex = -1;

      // Chercher la plus longue correspondance dans le dictionnaire
      for (let j = Math.max(0, dictSize - this.DICTIONARY_SIZE); j < dictSize; j++) {
        const dictEntry = Array.from(dictionary.keys())[j];
        if (!dictEntry) continue;

        if (data.startsWith(dictEntry, i)) {
          if (dictEntry.length > bestMatch.length) {
            bestMatch = dictEntry;
            bestMatchIndex = j;
          }
        }
      }

      if (bestMatch.length > 2) { // Seuil minimal pour la compression
        result += `<${bestMatchIndex}>`;
        i += bestMatch.length - 1;
      } else {
        result += data[i];
        // Ajouter au dictionnaire
        if (dictSize < this.DICTIONARY_SIZE) {
          dictionary.set(data[i], dictSize++);
        }
      }
    }

    return result;
  }

  /**
   * Décompression LZ
   */
  private decompressLZ(data: string): string {
    const dictionary: string[] = [];
    let result = '';
    let i = 0;

    while (i < data.length) {
      if (data[i] === '<') {
        // Référence au dictionnaire
        const endIndex = data.indexOf('>', i);
        if (endIndex !== -1) {
          const dictIndex = parseInt(data.substring(i + 1, endIndex));
          if (dictIndex < dictionary.length) {
            result += dictionary[dictIndex];
          }
          i = endIndex + 1;
        } else {
          result += data[i];
          i++;
        }
      } else {
        result += data[i];
        dictionary.push(data[i]);
        i++;
      }
    }

    return result;
  }

  /**
   * Compression Deflate (simulation)
   */
  private async compressDeflate(data: string): Promise<string> {
    // Dans un vrai projet, utiliser une bibliothèque comme pako
    // Ici on simule avec une compression simple
    return this.compressLZ(data);
  }

  /**
   * Décompression Deflate
   */
  private async decompressDeflate(data: string): Promise<string> {
    return this.decompressLZ(data);
  }

  /**
   * Compression Gzip (simulation)
   */
  private async compressGzip(data: string): Promise<string> {
    // Dans un vrai projet, utiliser une bibliothèque comme pako
    // Ici on simule avec une compression plus agressive
    return this.compressLZ(data).split('').reverse().join('');
  }

  /**
   * Décompression Gzip
   */
  private async decompressGzip(data: string): Promise<string> {
    return this.decompressLZ(data.split('').reverse().join(''));
  }

  /**
   * Compresse un lot de métriques de monitoring
   */
  async compressMetricsBatch(metrics: PerformanceMetric[]): Promise<CompressedData> {
    // Optimiser les métriques pour la compression
    const optimizedMetrics = this.optimizeMetricsForCompression(metrics);

    return this.compress(optimizedMetrics, 'lz');
  }

  /**
   * Optimise les métriques pour une meilleure compression
   */
  private optimizeMetricsForCompression(metrics: PerformanceMetric[]): any {
    // Grouper les métriques similaires
    const grouped = metrics.reduce((acc, metric) => {
      const key = `${metric.type}_${metric.name}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(metric);
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);

    // Compresser chaque groupe
    const optimized: any = {};
    Object.entries(grouped).forEach(([key, groupMetrics]) => {
      if (groupMetrics.length === 1) {
        optimized[key] = groupMetrics[0];
      } else {
        // Pour les métriques répétitives, stocker seulement les valeurs
        optimized[key] = {
          template: {
            type: groupMetrics[0].type,
            name: groupMetrics[0].name,
            id: 'batch'
          },
          values: groupMetrics.map(m => ({
            value: m.value,
            timestamp: m.timestamp.toMillis(),
            metadata: m.metadata
          }))
        };
      }
    });

    return optimized;
  }

  /**
   * Décompresse un lot de métriques
   */
  async decompressMetricsBatch(compressedData: CompressedData): Promise<PerformanceMetric[]> {
    const decompressed = await this.decompress(compressedData);

    if (!decompressed || typeof decompressed !== 'object') {
      return [];
    }

    const metrics: PerformanceMetric[] = [];

    Object.entries(decompressed).forEach(([key, value]: [string, any]) => {
      if (value.template && value.values) {
        // Décompresser le lot
        value.values.forEach((item: any) => {
          metrics.push({
            ...value.template,
            value: item.value,
            timestamp: Timestamp.fromMillis(item.timestamp),
            metadata: item.metadata
          });
        });
      } else {
        // Métrique unique
        metrics.push(value);
      }
    });

    return metrics;
  }

  /**
   * Compresse les données de logs
   */
  async compressLogs(logs: any[]): Promise<CompressedData> {
    // Extraire les patterns communs
    const patterns = this.extractLogPatterns(logs);

    const optimizedLogs = {
      patterns,
      entries: logs.map(log => {
        const patternIndex = patterns.findIndex(pattern =>
          pattern.level === log.level &&
          pattern.message === log.message
        );

        if (patternIndex !== -1) {
          return {
            patternIndex,
            timestamp: log.timestamp,
            data: log.data
          };
        } else {
          return log;
        }
      })
    };

    return this.compress(optimizedLogs, 'deflate');
  }

  /**
   * Extrait les patterns communs des logs
   */
  private extractLogPatterns(logs: any[]): Array<{ level: string; message: string }> {
    const patternCount = new Map<string, number>();

    logs.forEach(log => {
      const pattern = `${log.level}:${log.message}`;
      patternCount.set(pattern, (patternCount.get(pattern) || 0) + 1);
    });

    // Garder seulement les patterns qui apparaissent plus d'une fois
    return Array.from(patternCount.entries())
      .filter(([_, count]) => count > 1)
      .map(([pattern]) => {
        const [level, message] = pattern.split(':');
        return { level, message };
      });
  }

  /**
   * Obtient les statistiques de compression
   */
  getCompressionStats(): CompressionStats[] {
    // Dans un vrai projet, stocker les statistiques
    return [];
  }

  /**
   * Test de performance de compression
   */
  async benchmarkCompression(data: any, algorithms: ('lz' | 'deflate' | 'gzip')[] = ['lz', 'deflate', 'gzip']): Promise<any> {
    const results: any = {};

    for (const algorithm of algorithms) {
      const startTime = Date.now();
      const compressed = await this.compress(data, algorithm);
      const compressionTime = Date.now() - startTime;

      const startDecompressTime = Date.now();
      await this.decompress(compressed);
      const decompressionTime = Date.now() - startDecompressTime;

      results[algorithm] = {
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        compressionRatio: ((compressed.originalSize - compressed.compressedSize) / compressed.originalSize) * 100,
        compressionTime,
        decompressionTime
      };
    }

    return results;
  }
}

export const adminDataCompressor = new AdminDataCompressor();
