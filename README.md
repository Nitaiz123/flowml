# FlowML — Production-Grade ML Pipeline Automation

> Build, deploy, and monitor ML pipelines without the Kubeflow complexity.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-00e5ff?style=for-the-badge&logo=github)](https://nitaiz123.github.io/flowml/)
[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](LICENSE)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://python.org)
[![Kubernetes](https://img.shields.io/badge/kubernetes-1.26+-blue.svg)](https://kubernetes.io)

## 🌐 Live Demo

**[https://nitaiz123.github.io/flowml/](https://nitaiz123.github.io/flowml/)**

Try the visual pipeline builder in your browser — drag-and-drop nodes, connect them, run pipelines, and export Kubernetes manifests or Helm charts. No setup required.

---

## The Problem

Every ML team ends up duct-taping 5+ tools together:

| Pain Point | Current "Solution" |
|---|---|
| Kubeflow requires a PhD in K8s just to deploy one model | Write 400 lines of YAML by hand |
| No unified tool — Airflow + MLflow + Docker + Helm + Prometheus | Context-switch between 5 dashboards |
| Zero observability out of the box | Write custom Prometheus scrapers |
| CLI-only or UI-only | Pick one, suffer with the other |
| Deployment strategies are manual | Custom bash scripts for canary rollouts |
| Reproducibility is broken | "It worked on my machine" |

**FlowML solves all of this in one tool.**

---

## Features

- **Visual drag-and-drop pipeline builder** — build pipelines without writing YAML
- **CLI-first** — everything the UI does, the CLI does too
- **One-command Kubernetes deployment** — rolling, canary, blue-green strategies
- **Built-in observability** — Prometheus metrics, Grafana dashboards, drift detection
- **Pipeline templates** — NLP, CV, time series, RAG — scaffold in seconds
- **Artifact lineage** — track every model version, dataset, and metric
- **Auto-generated K8s manifests + Helm charts** — no YAML expertise required

---

## Quick Start

### CLI

```bash
# Install
pip install flowml-cli

# Create a new pipeline project
flowml init my-model --template nlp

# Run locally
cd my-model
flowml run pipeline.yaml

# Build Docker image
flowml build --push --registry docker.io/your-org

# Deploy to Kubernetes
flowml deploy --strategy rolling --replicas 3

# Monitor
flowml status
flowml metrics --window 24h
flowml logs --follow
```

### Web UI

```bash
# Clone and run
git clone https://github.com/Nitaiz123/flowml
cd flowml
pnpm install && pnpm dev

# Open http://localhost:3000
```

---

## CLI Reference

| Command | Description |
|---|---|
| `flowml init <name>` | Scaffold a new pipeline project |
| `flowml run <pipeline.yaml>` | Run pipeline locally or in container |
| `flowml build` | Build Docker image |
| `flowml deploy` | Deploy to Kubernetes |
| `flowml status` | Show deployment health |
| `flowml logs` | Stream pod logs |
| `flowml metrics` | Show performance metrics |
| `flowml rollback --to v0.9.0` | Rollback to previous version |
| `flowml scale --replicas 5` | Scale deployment |
| `flowml drift check` | Run data drift detection |
| `flowml generate k8s` | Generate Kubernetes manifests |
| `flowml generate helm` | Generate Helm chart |

### Pipeline Templates

```bash
flowml init my-pipeline --template basic      # Data → Train → Evaluate → Deploy
flowml init my-nlp --template nlp             # Corpus → Tokenize → Fine-tune LLM → Deploy
flowml init my-cv --template cv               # Images → Augment → Train CNN → Export ONNX
flowml init my-ts --template timeseries       # Time series → Feature Eng → LSTM → Backtest
flowml init my-rag --template rag             # Docs → Chunk → Index → RAG API
```

### Deployment Strategies

```bash
# Rolling update (default — zero downtime)
flowml deploy --strategy rolling

# Canary (10% traffic to new version)
flowml deploy --strategy canary --canary-weight 10

# Blue/green (full swap)
flowml deploy --strategy blue-green

# Dry run — preview manifests without applying
flowml deploy --dry-run
```

---

## Pipeline YAML

```yaml
name: my-nlp-pipeline
version: 1.0.0

kubernetes:
  namespace: ml-models
  resources:
    requests: { cpu: "500m", memory: "1Gi" }
    limits: { cpu: "2", memory: "4Gi" }
  autoscaling:
    enabled: true
    min_replicas: 2
    max_replicas: 10

docker:
  registry: docker.io
  base_image: python:3.11-slim
  push: true

observability:
  prometheus:
    enabled: true
    port: 9090
  grafana:
    enabled: true
  drift_detection:
    enabled: true
    method: evidently
    threshold: 0.1

steps:
  - id: load_data
    name: Load Corpus
    type: data
    config:
      source: s3
      bucket: my-bucket
      format: parquet

  - id: tokenize
    name: Tokenize
    type: transform
    depends_on: [load_data]
    config:
      tokenizer: bert-base-uncased
      max_length: 512

  - id: train
    name: Fine-tune LLM
    type: train
    depends_on: [tokenize]
    config:
      model: bert-base-uncased
      epochs: 3
      batch_size: 32
      learning_rate: 2e-5

  - id: evaluate
    name: Evaluate
    type: evaluate
    depends_on: [train]
    config:
      metrics: [accuracy, f1, auc]
      threshold: { accuracy: 0.90 }

  - id: deploy
    name: Deploy API
    type: deploy
    depends_on: [evaluate]
    config:
      strategy: rolling
      replicas: 3
```

---

## Observability

FlowML ships with a complete observability stack:

### Metrics (Prometheus)
- Request throughput, P50/P95/P99 latency, error rate
- Model accuracy, F1, AUC over time
- Data drift score (Evidently integration)
- Pod CPU/memory, HPA scaling events

### Dashboards (Grafana)
Pre-built dashboards for:
- Model performance over time
- Infrastructure health
- Data drift monitoring
- Deployment history

### Alerts
- High latency (P99 > 500ms)
- High error rate (> 5%)
- Data drift detected (score > 0.1)
- Pod crash looping
- High CPU/memory usage

### Local Stack

```bash
# Start full observability stack locally
docker-compose -f deploy/docker/docker-compose.yml up -d

# Access
# Model API:   http://localhost:8080
# Prometheus:  http://localhost:9091
# Grafana:     http://localhost:3001  (admin / flowml-admin)
# MinIO:       http://localhost:9001
```

---

## Kubernetes Deployment

### Direct manifests

```bash
kubectl apply -f deploy/kubernetes/deployment.yaml
```

### Helm chart

```bash
# Install
helm install flowml ./deploy/helm/flowml \
  --set image.repository=docker.io/your-org/flowml-model \
  --set image.tag=v1.0.0 \
  --namespace ml-models --create-namespace

# Upgrade
helm upgrade flowml ./deploy/helm/flowml \
  --set image.tag=v1.1.0

# Canary rollout
helm upgrade flowml ./deploy/helm/flowml \
  --set deploymentStrategy.type=canary \
  --set deploymentStrategy.canary.weight=10
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FlowML Platform                       │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Web UI      │    │  CLI         │    │  pipeline.yaml│  │
│  │  (React +    │    │  (Python)    │    │  (config)    │  │
│  │  React Flow) │    │              │    │              │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         └──────────────────┼──────────────────┘           │
│                            ▼                               │
│              ┌─────────────────────────┐                   │
│              │   Pipeline Engine       │                   │
│              │   - DAG execution       │                   │
│              │   - Artifact tracking   │                   │
│              │   - Step caching        │                   │
│              └────────────┬────────────┘                   │
│                           ▼                                │
│    ┌──────────┐  ┌──────────────┐  ┌─────────────────┐    │
│    │ Docker   │  │  Kubernetes  │  │  Observability  │    │
│    │ Build    │  │  Deploy      │  │  Prometheus +   │    │
│    │ & Push   │  │  (rolling /  │  │  Grafana +      │    │
│    │          │  │  canary /    │  │  Drift Detect   │    │
│    │          │  │  blue-green) │  │                 │    │
│    └──────────┘  └──────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
flowml/
├── client/                    # React web UI
│   └── src/
│       ├── pages/
│       │   ├── Home.tsx       # Landing page
│       │   └── PipelineBuilder.tsx  # Main builder
│       ├── components/
│       │   ├── PipelineNode.tsx     # Custom React Flow node
│       │   ├── NodePalette.tsx      # Left sidebar
│       │   ├── NodeConfigPanel.tsx  # Right config panel
│       │   ├── ExecutionLog.tsx     # Bottom log panel
│       │   ├── ObservabilityPanel.tsx  # Metrics dashboard
│       │   ├── ExportModal.tsx      # Export YAML/K8s/Helm
│       │   └── TemplatesModal.tsx   # Pipeline templates
│       └── lib/
│           └── pipelineStore.ts    # Zustand state + types
│
├── cli/                       # Python CLI package
│   ├── flowml/
│   │   ├── __init__.py
│   │   └── main.py            # All CLI commands
│   └── setup.py
│
├── deploy/
│   ├── kubernetes/
│   │   └── deployment.yaml    # K8s Deployment + Service + HPA
│   ├── helm/flowml/           # Helm chart
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/
│   ├── docker/
│   │   └── docker-compose.yml # Full local stack
│   └── observability/
│       ├── prometheus.yml     # Prometheus config
│       └── alerts.yml         # Alerting rules
│
└── README.md
```

---

## License

MIT © [Nityanand Pujari](https://github.com/Nitaiz123)
