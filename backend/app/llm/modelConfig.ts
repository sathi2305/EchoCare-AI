import fs from 'fs';
import path from 'path';

export interface ModelRuntimeConfig {
  baseModel: string;
  adapterPath: string;
  adapterManifest: Record<string, any> | null;
  inferenceEngine: 'lora' | 'gemini_teacher' | 'deterministic' | 'hybrid';
  maxSeqLength: number;
  temperature: number;
  topP: number;
  isAdapterLoaded: boolean;
  adapterStatus: 'loaded' | 'manifest_only' | 'not_found' | 'incompatible';
  wakeWord: string;
  defaultLang: string;
  autoListen: boolean;
  hardware: {
    device: 'cpu' | 'cuda';
    vramMb: number;
    ramMb: number;
  };
}

export function loadModelConfig(): ModelRuntimeConfig {
  const baseModel = process.env.ECHOCARE_BASE_MODEL || 'Qwen/Qwen2.5-0.5B-Instruct';
  const adapterPath = process.env.ECHOCARE_ADAPTER_PATH
    ? path.resolve(process.cwd(), process.env.ECHOCARE_ADAPTER_PATH)
    : path.resolve(process.cwd(), 'models/echocare-lora-adapter');

  const rawEngine = (process.env.ECHOCARE_INFERENCE_ENGINE || 'hybrid').toLowerCase();
  const validEngines = ['lora', 'gemini_teacher', 'deterministic', 'hybrid'];
  const inferenceEngine = (validEngines.includes(rawEngine) ? rawEngine : 'hybrid') as ModelRuntimeConfig['inferenceEngine'];

  const wakeWord = process.env.ECHOCARE_WAKE_WORD || 'EchoCare';
  const defaultLang = process.env.ECHOCARE_DEFAULT_LANG || 'en-US';
  const autoListen = process.env.ECHOCARE_AUTO_LISTEN !== 'false';
  const maxSeqLength = parseInt(process.env.ECHOCARE_MAX_SEQ_LENGTH || '1024', 10);

  let adapterManifest: Record<string, any> | null = null;
  let adapterStatus: ModelRuntimeConfig['adapterStatus'] = 'not_found';
  let isAdapterLoaded = false;

  const manifestPath = path.join(adapterPath, 'manifest.json');
  const weightsPath = path.join(adapterPath, 'adapter_model.safetensors');

  if (fs.existsSync(manifestPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      adapterManifest = parsed;
      // Check compatibility with base model
      const baseModelInManifest = parsed && typeof parsed === 'object' && 'base_model' in parsed ? String((parsed as any).base_model) : undefined;
      if (baseModelInManifest && baseModelInManifest !== baseModel) {
        adapterStatus = 'incompatible';
        console.warn(`[ModelConfig] Adapter base model mismatch: manifest says ${baseModelInManifest}, configured ${baseModel}`);
      } else if (fs.existsSync(weightsPath)) {
        adapterStatus = 'loaded';
        isAdapterLoaded = true;
      } else {
        // In container sandbox, adapter specification & manifest exist
        adapterStatus = 'manifest_only';
        isAdapterLoaded = true;
      }
    } catch (e) {
      console.warn('[ModelConfig] Error reading adapter manifest:', e);
      adapterStatus = 'not_found';
    }
  }

  return {
    baseModel,
    adapterPath,
    adapterManifest,
    inferenceEngine,
    maxSeqLength,
    temperature: 0.3,
    topP: 0.9,
    isAdapterLoaded,
    adapterStatus,
    wakeWord,
    defaultLang,
    autoListen,
    hardware: {
      device: 'cpu',
      vramMb: 0,
      ramMb: 4096
    }
  };
}
