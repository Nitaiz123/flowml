/**
 * pipelineStore.ts — Node templates, categories, pipeline templates, and types
 * Blueprint Engineering Theme
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type NodeCategory = 'data' | 'transform' | 'train' | 'evaluate' | 'deploy' | 'custom';

export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'skipped';

export interface PipelineNodeData {
  label: string;
  category: NodeCategory;
  icon: string;
  status: NodeStatus;
  description: string;
  config: Record<string, string | number | boolean | string[]>;
  outputs?: Record<string, string>;
  duration?: string;
  error?: string;
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'textarea';
  description?: string;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  options?: string[];
}

export interface NodeTemplate {
  type: string;
  label: string;
  category: NodeCategory;
  icon: string;
  description: string;
  defaultConfig: Record<string, string | number | boolean>;
  configSchema: ConfigField[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  nodeId?: string;
  nodeName?: string;
  message: string;
}

export interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: Array<{
    type: string;
    position: { x: number; y: number };
    config?: Record<string, string | number | boolean>;
  }>;
  edges: Array<{ source: string; target: string }>;
}

// ─── Category metadata ────────────────────────────────────────────────────────

export const NODE_CATEGORIES: Record<NodeCategory, { label: string; color: string; description: string }> = {
  data: { label: 'Data', color: '#2563EB', description: 'Load and ingest data from various sources' },
  transform: { label: 'Transform', color: '#0D9488', description: 'Preprocess, clean, and engineer features' },
  train: { label: 'Train', color: '#7C3AED', description: 'Train machine learning models' },
  evaluate: { label: 'Evaluate', color: '#D97706', description: 'Measure model performance' },
  deploy: { label: 'Deploy', color: '#059669', description: 'Package and deploy trained models' },
  custom: { label: 'Custom', color: '#6B6B6B', description: 'Custom scripts and utilities' },
};

// ─── Node Templates ───────────────────────────────────────────────────────────

export const NODE_TEMPLATES: NodeTemplate[] = [
  // ── Data ──
  {
    type: 'csv_loader',
    label: 'CSV Loader',
    category: 'data',
    icon: 'FileSpreadsheet',
    description: 'Load a CSV file from disk or URL into a DataFrame.',
    defaultConfig: { path: '', delimiter: ',', has_header: true, encoding: 'utf-8' },
    configSchema: [
      { key: 'path', label: 'File Path / URL', type: 'text', placeholder: 'data/train.csv or https://...', description: 'Local path or remote URL to the CSV file.' },
      { key: 'delimiter', label: 'Delimiter', type: 'select', options: [',', ';', '\t', '|'], defaultValue: ',' },
      { key: 'has_header', label: 'Has Header Row', type: 'boolean', defaultValue: true },
      { key: 'encoding', label: 'Encoding', type: 'select', options: ['utf-8', 'latin-1', 'utf-16'], defaultValue: 'utf-8' },
    ],
  },
  {
    type: 'sql_query',
    label: 'SQL Query',
    category: 'data',
    icon: 'Database',
    description: 'Execute a SQL query against a database and return results.',
    defaultConfig: { connection_string: '', query: 'SELECT * FROM table LIMIT 1000', timeout: 30 },
    configSchema: [
      { key: 'connection_string', label: 'Connection String', type: 'text', placeholder: 'postgresql://user:pass@host/db' },
      { key: 'query', label: 'SQL Query', type: 'textarea', placeholder: 'SELECT * FROM ...', defaultValue: 'SELECT * FROM table LIMIT 1000' },
      { key: 'timeout', label: 'Timeout (seconds)', type: 'number', defaultValue: 30 },
    ],
  },
  {
    type: 'api_ingest',
    label: 'API Ingest',
    category: 'data',
    icon: 'Globe',
    description: 'Fetch data from a REST API endpoint.',
    defaultConfig: { url: '', method: 'GET', auth_token: '' },
    configSchema: [
      { key: 'url', label: 'API URL', type: 'text', placeholder: 'https://api.example.com/data' },
      { key: 'method', label: 'HTTP Method', type: 'select', options: ['GET', 'POST'], defaultValue: 'GET' },
      { key: 'auth_token', label: 'Auth Token', type: 'text', placeholder: 'Bearer token (optional)' },
    ],
  },
  {
    type: 's3_loader',
    label: 'S3 Loader',
    category: 'data',
    icon: 'Cloud',
    description: 'Load data from an AWS S3 bucket.',
    defaultConfig: { bucket: '', key: '', region: 'us-east-1', format: 'csv' },
    configSchema: [
      { key: 'bucket', label: 'S3 Bucket', type: 'text', placeholder: 'my-ml-data-bucket' },
      { key: 'key', label: 'Object Key', type: 'text', placeholder: 'datasets/train.parquet' },
      { key: 'region', label: 'AWS Region', type: 'select', options: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'], defaultValue: 'us-east-1' },
      { key: 'format', label: 'File Format', type: 'select', options: ['csv', 'parquet', 'json', 'jsonl'], defaultValue: 'parquet' },
    ],
  },

  // ── Transform ──
  {
    type: 'feature_engineer',
    label: 'Feature Engineer',
    category: 'transform',
    icon: 'Wrench',
    description: 'Create new features from existing columns using expressions.',
    defaultConfig: { script: '', drop_original: false },
    configSchema: [
      { key: 'script', label: 'Feature Script', type: 'textarea', placeholder: 'df["log_price"] = np.log1p(df["price"])', description: 'Python expressions to create new columns.' },
      { key: 'drop_original', label: 'Drop Source Columns', type: 'boolean', defaultValue: false },
    ],
  },
  {
    type: 'train_test_split',
    label: 'Train/Test Split',
    category: 'transform',
    icon: 'Scissors',
    description: 'Split dataset into training and test sets.',
    defaultConfig: { test_size: 0.2, random_state: 42, stratify: false },
    configSchema: [
      { key: 'test_size', label: 'Test Size', type: 'number', defaultValue: 0.2, description: 'Fraction of data for the test set (0.0–1.0).' },
      { key: 'random_state', label: 'Random Seed', type: 'number', defaultValue: 42 },
      { key: 'stratify', label: 'Stratified Split', type: 'boolean', defaultValue: false, description: 'Preserve class distribution in splits.' },
    ],
  },
  {
    type: 'text_vectorizer',
    label: 'Text Vectorizer',
    category: 'transform',
    icon: 'Type',
    description: 'Convert text columns to numeric vectors (TF-IDF, embeddings).',
    defaultConfig: { method: 'tfidf', max_features: 10000, column: 'text' },
    configSchema: [
      { key: 'column', label: 'Text Column', type: 'text', placeholder: 'text', defaultValue: 'text' },
      { key: 'method', label: 'Vectorization Method', type: 'select', options: ['tfidf', 'count', 'word2vec', 'bert-base'], defaultValue: 'tfidf' },
      { key: 'max_features', label: 'Max Features', type: 'number', defaultValue: 10000 },
    ],
  },

  // ── Train ──
  {
    type: 'sklearn_model',
    label: 'Sklearn Model',
    category: 'train',
    icon: 'BrainCircuit',
    description: 'Train a scikit-learn classification or regression model.',
    defaultConfig: { model: 'RandomForestClassifier', n_estimators: 100, max_depth: 10, target_column: 'label' },
    configSchema: [
      { key: 'model', label: 'Model Type', type: 'select', options: ['RandomForestClassifier', 'GradientBoostingClassifier', 'LogisticRegression', 'SVC', 'XGBClassifier', 'LinearRegression', 'Ridge', 'Lasso'], defaultValue: 'RandomForestClassifier' },
      { key: 'target_column', label: 'Target Column', type: 'text', placeholder: 'label', defaultValue: 'label' },
      { key: 'n_estimators', label: 'N Estimators', type: 'number', defaultValue: 100 },
      { key: 'max_depth', label: 'Max Depth', type: 'number', defaultValue: 10 },
    ],
  },
  {
    type: 'pytorch_trainer',
    label: 'PyTorch Trainer',
    category: 'train',
    icon: 'Cpu',
    description: 'Train a PyTorch neural network with configurable architecture.',
    defaultConfig: { epochs: 20, batch_size: 32, learning_rate: 0.001, optimizer: 'Adam', device: 'auto' },
    configSchema: [
      { key: 'epochs', label: 'Epochs', type: 'number', defaultValue: 20 },
      { key: 'batch_size', label: 'Batch Size', type: 'number', defaultValue: 32 },
      { key: 'learning_rate', label: 'Learning Rate', type: 'number', defaultValue: 0.001 },
      { key: 'optimizer', label: 'Optimizer', type: 'select', options: ['Adam', 'SGD', 'AdamW', 'RMSprop'], defaultValue: 'Adam' },
      { key: 'device', label: 'Device', type: 'select', options: ['auto', 'cpu', 'cuda', 'mps'], defaultValue: 'auto' },
    ],
  },
  {
    type: 'hyperparameter_tuner',
    label: 'HP Tuner',
    category: 'train',
    icon: 'SlidersHorizontal',
    description: 'Automated hyperparameter search with Optuna or GridSearch.',
    defaultConfig: { method: 'optuna', n_trials: 50, metric: 'accuracy', direction: 'maximize' },
    configSchema: [
      { key: 'method', label: 'Search Method', type: 'select', options: ['optuna', 'grid_search', 'random_search', 'bayesian'], defaultValue: 'optuna' },
      { key: 'n_trials', label: 'Number of Trials', type: 'number', defaultValue: 50 },
      { key: 'metric', label: 'Optimization Metric', type: 'text', defaultValue: 'accuracy' },
      { key: 'direction', label: 'Direction', type: 'select', options: ['maximize', 'minimize'], defaultValue: 'maximize' },
    ],
  },

  // ── Evaluate ──
  {
    type: 'model_evaluator',
    label: 'Model Evaluator',
    category: 'evaluate',
    icon: 'BarChart3',
    description: 'Compute classification/regression metrics on the test set.',
    defaultConfig: { task: 'classification', metrics: 'accuracy,f1,roc_auc', threshold: 0.5 },
    configSchema: [
      { key: 'task', label: 'Task Type', type: 'select', options: ['classification', 'regression', 'multi-class'], defaultValue: 'classification' },
      { key: 'metrics', label: 'Metrics', type: 'text', defaultValue: 'accuracy,f1,roc_auc', description: 'Comma-separated list of metrics to compute.' },
      { key: 'threshold', label: 'Decision Threshold', type: 'number', defaultValue: 0.5 },
    ],
  },
  {
    type: 'confusion_matrix',
    label: 'Confusion Matrix',
    category: 'evaluate',
    icon: 'Grid3x3',
    description: 'Generate and visualize a confusion matrix.',
    defaultConfig: { normalize: false, class_names: '' },
    configSchema: [
      { key: 'normalize', label: 'Normalize Values', type: 'boolean', defaultValue: false },
      { key: 'class_names', label: 'Class Names', type: 'text', placeholder: 'cat,dog,bird (optional)' },
    ],
  },

  // ── Deploy ──
  {
    type: 'model_registry',
    label: 'Model Registry',
    category: 'deploy',
    icon: 'Archive',
    description: 'Register the trained model to MLflow or a custom registry.',
    defaultConfig: { registry: 'mlflow', model_name: '', version_tag: 'latest', tracking_uri: 'http://localhost:5000' },
    configSchema: [
      { key: 'registry', label: 'Registry', type: 'select', options: ['mlflow', 'wandb', 'neptune', 'custom'], defaultValue: 'mlflow' },
      { key: 'model_name', label: 'Model Name', type: 'text', placeholder: 'my-classifier-v1' },
      { key: 'tracking_uri', label: 'Tracking URI', type: 'text', defaultValue: 'http://localhost:5000' },
      { key: 'version_tag', label: 'Version Tag', type: 'text', defaultValue: 'latest' },
    ],
  },
  {
    type: 'rest_api_deploy',
    label: 'REST API Deploy',
    category: 'deploy',
    icon: 'Rocket',
    description: 'Wrap the model as a FastAPI REST endpoint.',
    defaultConfig: { host: '0.0.0.0', port: 8080, workers: 4, auth: false },
    configSchema: [
      { key: 'host', label: 'Host', type: 'text', defaultValue: '0.0.0.0' },
      { key: 'port', label: 'Port', type: 'number', defaultValue: 8080 },
      { key: 'workers', label: 'Workers', type: 'number', defaultValue: 4 },
      { key: 'auth', label: 'Require Auth Token', type: 'boolean', defaultValue: false },
    ],
  },
  {
    type: 'docker_package',
    label: 'Docker Package',
    category: 'deploy',
    icon: 'Box',
    description: 'Package model + inference code into a Docker image.',
    defaultConfig: { base_image: 'python:3.11-slim', image_name: 'my-model', tag: 'latest', push: false },
    configSchema: [
      { key: 'base_image', label: 'Base Image', type: 'select', options: ['python:3.11-slim', 'pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime', 'tensorflow/tensorflow:2.13.0'], defaultValue: 'python:3.11-slim' },
      { key: 'image_name', label: 'Image Name', type: 'text', placeholder: 'my-model' },
      { key: 'tag', label: 'Tag', type: 'text', defaultValue: 'latest' },
      { key: 'push', label: 'Push to Registry', type: 'boolean', defaultValue: false },
    ],
  },

  // ── Custom ──
  {
    type: 'python_script',
    label: 'Python Script',
    category: 'custom',
    icon: 'Code2',
    description: 'Run arbitrary Python code as a pipeline step.',
    defaultConfig: { script: '# df = input_data\n# output = df.copy()', timeout: 300 },
    configSchema: [
      { key: 'script', label: 'Python Code', type: 'textarea', placeholder: '# df = input_data\n# output = df.copy()', defaultValue: '# df = input_data\n# output = df.copy()' },
      { key: 'timeout', label: 'Timeout (seconds)', type: 'number', defaultValue: 300 },
    ],
  },
];

// ─── Pipeline Templates ───────────────────────────────────────────────────────

export const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  {
    id: 'classification',
    name: 'Classification Pipeline',
    description: 'End-to-end binary or multi-class classification: CSV → features → train → evaluate → deploy.',
    category: 'Classification',
    nodes: [
      { type: 'csv_loader', position: { x: 80, y: 200 }, config: { path: 'data/train.csv' } },
      { type: 'feature_engineer', position: { x: 340, y: 200 } },
      { type: 'train_test_split', position: { x: 600, y: 200 } },
      { type: 'sklearn_model', position: { x: 860, y: 200 }, config: { model: 'RandomForestClassifier' } },
      { type: 'model_evaluator', position: { x: 1120, y: 200 } },
      { type: 'model_registry', position: { x: 1380, y: 200 } },
    ],
    edges: [
      { source: '0', target: '1' },
      { source: '1', target: '2' },
      { source: '2', target: '3' },
      { source: '3', target: '4' },
      { source: '4', target: '5' },
    ],
  },
  {
    id: 'nlp',
    name: 'NLP Text Classification',
    description: 'Text classification pipeline: ingest → vectorize → train → evaluate → REST API.',
    category: 'NLP',
    nodes: [
      { type: 'api_ingest', position: { x: 80, y: 200 }, config: { url: 'https://api.example.com/texts' } },
      { type: 'text_vectorizer', position: { x: 340, y: 200 }, config: { method: 'tfidf' } },
      { type: 'train_test_split', position: { x: 600, y: 200 } },
      { type: 'sklearn_model', position: { x: 860, y: 200 }, config: { model: 'LogisticRegression' } },
      { type: 'model_evaluator', position: { x: 1120, y: 200 } },
      { type: 'rest_api_deploy', position: { x: 1380, y: 200 } },
    ],
    edges: [
      { source: '0', target: '1' },
      { source: '1', target: '2' },
      { source: '2', target: '3' },
      { source: '3', target: '4' },
      { source: '4', target: '5' },
    ],
  },
  {
    id: 'deep_learning',
    name: 'Deep Learning Pipeline',
    description: 'PyTorch training with hyperparameter tuning, evaluation, and Docker packaging.',
    category: 'Deep Learning',
    nodes: [
      { type: 's3_loader', position: { x: 80, y: 200 }, config: { format: 'parquet' } },
      { type: 'feature_engineer', position: { x: 340, y: 200 } },
      { type: 'train_test_split', position: { x: 600, y: 200 } },
      { type: 'hyperparameter_tuner', position: { x: 860, y: 200 } },
      { type: 'pytorch_trainer', position: { x: 1120, y: 200 } },
      { type: 'model_evaluator', position: { x: 1380, y: 200 } },
      { type: 'docker_package', position: { x: 1640, y: 200 } },
    ],
    edges: [
      { source: '0', target: '1' },
      { source: '1', target: '2' },
      { source: '2', target: '3' },
      { source: '3', target: '4' },
      { source: '4', target: '5' },
      { source: '5', target: '6' },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function generateExecutionLogs(nodeLabel: string, status: 'success' | 'error'): string[] {
  if (status === 'success') {
    return [
      `[${nodeLabel}] Initializing...`,
      `[${nodeLabel}] Processing data...`,
      `[${nodeLabel}] ✓ Completed successfully`,
    ];
  }
  return [
    `[${nodeLabel}] Initializing...`,
    `[${nodeLabel}] ✗ Error: unexpected input shape`,
  ];
}
