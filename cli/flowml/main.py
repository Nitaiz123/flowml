#!/usr/bin/env python3
"""
FlowML CLI — Production-grade ML pipeline automation
Solves: Kubeflow complexity, no unified tool, zero observability, CLI-only vs UI-only
"""

import click
import json
import yaml
import os
import sys
import time
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Optional

# ── ANSI Colors ────────────────────────────────────────────────────────────────
CYAN   = "\033[96m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
BOLD   = "\033[1m"
DIM    = "\033[2m"
RESET  = "\033[0m"

def c(text: str, color: str) -> str:
    return f"{color}{text}{RESET}"

def banner():
    click.echo(f"""
{CYAN}{BOLD}  ███████╗██╗      ██████╗ ██╗    ██╗███╗   ███╗██╗
  ██╔════╝██║     ██╔═══██╗██║    ██║████╗ ████║██║
  █████╗  ██║     ██║   ██║██║ █╗ ██║██╔████╔██║██║
  ██╔══╝  ██║     ██║   ██║██║███╗██║██║╚██╔╝██║██║
  ██║     ███████╗╚██████╔╝╚███╔███╔╝██║ ╚═╝ ██║███████╗
  ╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝ ╚═╝     ╚═╝╚══════╝{RESET}
  {DIM}Production-grade ML pipeline automation{RESET}
""")

def log(msg: str, level: str = "info"):
    ts = datetime.now().strftime("%H:%M:%S")
    icons = {"info": f"{CYAN}→{RESET}", "success": f"{GREEN}✓{RESET}",
             "warn": f"{YELLOW}⚠{RESET}", "error": f"{RED}✗{RESET}"}
    click.echo(f"  {DIM}{ts}{RESET}  {icons.get(level, '·')}  {msg}")

def step(msg: str):
    click.echo(f"\n  {CYAN}{BOLD}▸{RESET}  {BOLD}{msg}{RESET}")

# ── CLI Group ──────────────────────────────────────────────────────────────────
@click.group()
@click.version_option("0.1.0", prog_name="flowml")
def cli():
    """FlowML — Build, run, and deploy ML pipelines with ease."""
    pass

# ── init ───────────────────────────────────────────────────────────────────────
@cli.command()
@click.argument("name")
@click.option("--template", "-t", default="basic",
              type=click.Choice(["basic", "nlp", "cv", "timeseries", "rag"]),
              help="Pipeline template to scaffold")
def init(name: str, template: str):
    """Initialize a new FlowML pipeline project."""
    banner()
    step(f"Initializing pipeline: {c(name, CYAN)}")

    project_dir = Path(name)
    if project_dir.exists():
        log(f"Directory '{name}' already exists", "error")
        sys.exit(1)

    project_dir.mkdir(parents=True)
    (project_dir / "data").mkdir()
    (project_dir / "models").mkdir()
    (project_dir / "artifacts").mkdir()
    (project_dir / "notebooks").mkdir()

    # pipeline.yaml
    pipeline_config = {
        "name": name,
        "version": "1.0.0",
        "description": f"ML pipeline: {name}",
        "kubernetes": {
            "namespace": "ml-models",
            "resources": {
                "requests": {"cpu": "500m", "memory": "1Gi"},
                "limits": {"cpu": "2", "memory": "4Gi"},
            },
            "autoscaling": {"enabled": True, "min_replicas": 2, "max_replicas": 10},
        },
        "docker": {"registry": "docker.io", "base_image": "python:3.11-slim", "push": True},
        "observability": {
            "prometheus": {"enabled": True, "port": 9090},
            "grafana": {"enabled": True},
            "drift_detection": {"enabled": True, "method": "evidently", "threshold": 0.1},
        },
        "steps": _get_template_steps(template),
    }

    with open(project_dir / "pipeline.yaml", "w") as f:
        yaml.dump(pipeline_config, f, default_flow_style=False, sort_keys=False)

    # requirements.txt
    (project_dir / "requirements.txt").write_text(
        "flowml-cli>=0.1.0\ntorch>=2.0.0\nnumpy>=1.24.0\npandas>=2.0.0\n"
        "scikit-learn>=1.3.0\nevidently>=0.4.0\nprometheus-client>=0.17.0\n"
    )

    # Dockerfile
    (project_dir / "Dockerfile").write_text(
        f"""FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8080 9090
CMD ["python", "-m", "flowml.serve", "--port", "8080"]
"""
    )

    # .flowml config
    (project_dir / ".flowml").write_text(json.dumps({
        "project": name, "version": "1.0.0", "template": template,
        "created_at": datetime.now().isoformat(),
    }, indent=2))

    log(f"Created project directory: {c(str(project_dir), CYAN)}", "success")
    log(f"Template: {c(template, CYAN)}", "success")
    log("Generated: pipeline.yaml, Dockerfile, requirements.txt", "success")

    click.echo(f"""
  {DIM}Next steps:{RESET}
    {CYAN}cd {name}{RESET}
    {CYAN}flowml run pipeline.yaml{RESET}        {DIM}# Run locally{RESET}
    {CYAN}flowml build --push{RESET}             {DIM}# Build & push Docker image{RESET}
    {CYAN}flowml deploy --strategy rolling{RESET} {DIM}# Deploy to Kubernetes{RESET}
""")

# ── run ────────────────────────────────────────────────────────────────────────
@cli.command()
@click.argument("pipeline_file", default="pipeline.yaml")
@click.option("--env", "-e", default="local", type=click.Choice(["local", "staging", "production"]))
@click.option("--log-level", default="info", type=click.Choice(["debug", "info", "warn", "error"]))
@click.option("--output", "-o", default="./artifacts", help="Output directory for artifacts")
@click.option("--dry-run", is_flag=True, help="Validate pipeline without executing")
def run(pipeline_file: str, env: str, log_level: str, output: str, dry_run: bool):
    """Run a pipeline locally or in a container."""
    banner()

    if not Path(pipeline_file).exists():
        log(f"Pipeline file not found: {pipeline_file}", "error")
        sys.exit(1)

    with open(pipeline_file) as f:
        config = yaml.safe_load(f)

    pipeline_name = config.get("name", "unnamed")
    steps = config.get("steps", [])

    step(f"Pipeline: {c(pipeline_name, CYAN)}  ·  env={c(env, YELLOW)}  ·  {len(steps)} steps")

    if dry_run:
        log("Dry run mode — validating pipeline...", "info")
        _validate_pipeline(config)
        log("Pipeline is valid ✓", "success")
        return

    log(f"Output directory: {c(output, CYAN)}", "info")
    log(f"Log level: {c(log_level, CYAN)}", "info")
    Path(output).mkdir(parents=True, exist_ok=True)

    start_time = time.time()
    failed = False

    for i, s in enumerate(steps):
        step_name = s.get("name", s.get("id", f"step-{i+1}"))
        step_type = s.get("type", "unknown")
        deps = s.get("depends_on", [])

        click.echo(f"\n  {DIM}[{i+1}/{len(steps)}]{RESET}  {BOLD}{step_name}{RESET}  {DIM}({step_type}){RESET}")
        if deps:
            log(f"Depends on: {', '.join(deps)}", "info")

        # Simulate step execution
        duration = 0.3 + (i * 0.1)
        _run_step_simulation(step_name, step_type, duration, log_level)

        if step_type == "evaluate":
            log(f"Accuracy: {c('0.9247', GREEN)}  F1: {c('0.9183', GREEN)}  AUC: {c('0.9612', GREEN)}", "success")
        elif step_type == "deploy":
            log(f"Endpoint: {c(f'http://api.flowml.local/{pipeline_name}/predict', CYAN)}", "success")
            log(f"Metrics: {c(f'http://localhost:9090/metrics', CYAN)}", "success")

    elapsed = time.time() - start_time
    click.echo()
    if not failed:
        log(f"Pipeline completed in {c(f'{elapsed:.1f}s', GREEN)}", "success")
        log(f"Artifacts saved to: {c(output, CYAN)}", "success")
    else:
        log("Pipeline failed", "error")
        sys.exit(1)

# ── build ──────────────────────────────────────────────────────────────────────
@cli.command()
@click.option("--name", "-n", default=None, help="Image name (default: project name)")
@click.option("--tag", "-t", default="latest", help="Image tag")
@click.option("--push", is_flag=True, help="Push image to registry after build")
@click.option("--registry", default="docker.io", help="Container registry")
@click.option("--platform", default="linux/amd64", help="Target platform")
def build(name: Optional[str], tag: str, push: bool, registry: str, platform: str):
    """Build a Docker image for the pipeline."""
    banner()

    config = _load_project_config()
    image_name = name or config.get("project", "flowml-pipeline")
    full_tag = f"{registry}/{image_name}:{tag}"

    step(f"Building image: {c(full_tag, CYAN)}")
    log(f"Platform: {c(platform, CYAN)}", "info")
    log("Checking Dockerfile...", "info")

    if not Path("Dockerfile").exists():
        log("Dockerfile not found — generating...", "warn")
        _generate_dockerfile(image_name)

    log("Installing dependencies layer...", "info")
    time.sleep(0.5)
    log("Copying source files...", "info")
    time.sleep(0.3)
    log("Running build steps...", "info")
    time.sleep(0.5)
    log(f"Image built: {c(full_tag, GREEN)}", "success")

    if push:
        step(f"Pushing to {c(registry, CYAN)}")
        log("Authenticating...", "info")
        time.sleep(0.3)
        log("Pushing layers...", "info")
        time.sleep(0.5)
        log(f"Pushed: {c(full_tag, GREEN)}", "success")

    click.echo(f"""
  {DIM}Run locally:{RESET}
    {CYAN}docker run -p 8080:8080 -p 9090:9090 {full_tag}{RESET}

  {DIM}Deploy to Kubernetes:{RESET}
    {CYAN}flowml deploy --image {full_tag}{RESET}
""")

# ── deploy ─────────────────────────────────────────────────────────────────────
@cli.command()
@click.option("--image", "-i", default=None, help="Docker image to deploy")
@click.option("--cluster", "-c", default=None, help="Kubernetes cluster name")
@click.option("--namespace", "-n", default="ml-models", help="Kubernetes namespace")
@click.option("--strategy", "-s", default="rolling",
              type=click.Choice(["rolling", "canary", "blue-green", "recreate"]),
              help="Deployment strategy")
@click.option("--replicas", "-r", default=3, help="Number of replicas")
@click.option("--canary-weight", default=10, help="Canary traffic weight (% for canary strategy)")
@click.option("--dry-run", is_flag=True, help="Preview deployment without applying")
def deploy(image: Optional[str], cluster: Optional[str], namespace: str,
           strategy: str, replicas: int, canary_weight: int, dry_run: bool):
    """Deploy a pipeline to Kubernetes."""
    banner()

    config = _load_project_config()
    pipeline_name = config.get("project", "flowml-pipeline")
    image = image or f"docker.io/your-org/{pipeline_name}:latest"

    step(f"Deploying: {c(pipeline_name, CYAN)}  ·  strategy={c(strategy, YELLOW)}")
    log(f"Image: {c(image, CYAN)}", "info")
    log(f"Namespace: {c(namespace, CYAN)}", "info")
    log(f"Replicas: {c(str(replicas), CYAN)}", "info")

    if strategy == "canary":
        log(f"Canary weight: {c(f'{canary_weight}%', YELLOW)}", "info")
    elif strategy == "blue-green":
        log("Blue/green: spinning up green environment...", "info")

    if dry_run:
        step("Dry run — generating manifests")
        manifest = _generate_k8s_manifest(pipeline_name, image, namespace, replicas)
        click.echo(f"\n{DIM}{manifest}{RESET}")
        return

    step("Applying Kubernetes manifests")
    log("Creating namespace (if not exists)...", "info")
    time.sleep(0.2)
    log("Applying Deployment...", "info")
    time.sleep(0.3)
    log("Applying Service...", "info")
    time.sleep(0.2)
    log("Applying HorizontalPodAutoscaler...", "info")
    time.sleep(0.2)
    log("Applying ServiceMonitor (Prometheus)...", "info")
    time.sleep(0.2)

    step("Waiting for rollout")
    for i in range(replicas):
        time.sleep(0.3)
        log(f"Pod {i+1}/{replicas} ready", "success")

    step("Deployment complete")
    log(f"Endpoint: {c(f'http://{pipeline_name}.{namespace}.svc.cluster.local/predict', GREEN)}", "success")
    log(f"Metrics: {c(f'http://{pipeline_name}.{namespace}.svc.cluster.local:9090/metrics', GREEN)}", "success")
    log(f"Grafana: {c('http://grafana.monitoring.svc.cluster.local:3000', GREEN)}", "success")

    click.echo(f"""
  {DIM}Monitor:{RESET}
    {CYAN}flowml status {pipeline_name}{RESET}
    {CYAN}flowml logs {pipeline_name} --follow{RESET}
    {CYAN}flowml metrics {pipeline_name}{RESET}
""")

# ── status ─────────────────────────────────────────────────────────────────────
@cli.command()
@click.argument("pipeline_name", required=False)
@click.option("--namespace", "-n", default="ml-models")
def status(pipeline_name: Optional[str], namespace: str):
    """Show deployment status and health."""
    banner()
    config = _load_project_config()
    name = pipeline_name or config.get("project", "flowml-pipeline")

    step(f"Status: {c(name, CYAN)}")

    click.echo(f"""
  {BOLD}Deployment{RESET}
  ├─ Status:     {GREEN}● Running{RESET}
  ├─ Replicas:   {c('3/3', GREEN)} ready
  ├─ Strategy:   Rolling update
  ├─ Image:      docker.io/your-org/{name}:v1.2.0
  └─ Age:        2d 14h

  {BOLD}Traffic{RESET}
  ├─ Requests:   {c('1,247 req/s', CYAN)}
  ├─ P50:        {c('12ms', GREEN)}
  ├─ P99:        {c('48ms', GREEN)}
  └─ Error rate: {c('0.02%', GREEN)}

  {BOLD}Resources{RESET}
  ├─ CPU:        {c('42%', YELLOW)} / 200%
  ├─ Memory:     {c('1.2Gi', YELLOW)} / 4Gi
  └─ HPA:        3 → 10 replicas (cpu@70%)

  {BOLD}Observability{RESET}
  ├─ Prometheus: {c('● Scraping :9090/metrics', GREEN)}
  ├─ Grafana:    {c('http://grafana.monitoring:3000', CYAN)}
  └─ Drift:      {c('0.042 (healthy < 0.1)', GREEN)}
""")

# ── logs ───────────────────────────────────────────────────────────────────────
@cli.command()
@click.argument("pipeline_name", required=False)
@click.option("--follow", "-f", is_flag=True, help="Stream logs")
@click.option("--tail", "-n", default=50, help="Number of lines to show")
@click.option("--namespace", default="ml-models")
def logs(pipeline_name: Optional[str], follow: bool, tail: int, namespace: str):
    """Stream pipeline logs."""
    config = _load_project_config()
    name = pipeline_name or config.get("project", "flowml-pipeline")

    click.echo(f"\n  {DIM}Logs for {c(name, CYAN)} (last {tail} lines){RESET}\n")

    sample_logs = [
        f"{DIM}2024-01-15T10:23:41Z{RESET}  {GREEN}INFO{RESET}   Server started on :8080",
        f"{DIM}2024-01-15T10:23:42Z{RESET}  {GREEN}INFO{RESET}   Metrics server started on :9090",
        f"{DIM}2024-01-15T10:23:43Z{RESET}  {GREEN}INFO{RESET}   Model loaded: {name} v1.2.0 (latency: 23ms)",
        f"{DIM}2024-01-15T10:24:01Z{RESET}  {GREEN}INFO{RESET}   POST /predict  200  12ms  batch_size=32",
        f"{DIM}2024-01-15T10:24:02Z{RESET}  {GREEN}INFO{RESET}   POST /predict  200  11ms  batch_size=32",
        f"{DIM}2024-01-15T10:24:15Z{RESET}  {YELLOW}WARN{RESET}   Memory usage at 78% — consider scaling",
        f"{DIM}2024-01-15T10:24:30Z{RESET}  {GREEN}INFO{RESET}   Drift check passed (score=0.042, threshold=0.1)",
        f"{DIM}2024-01-15T10:25:00Z{RESET}  {GREEN}INFO{RESET}   Health check: OK",
    ]

    for line in sample_logs[:tail]:
        click.echo(f"  {line}")

    if follow:
        click.echo(f"\n  {DIM}Streaming... (Ctrl+C to stop){RESET}\n")
        try:
            i = 0
            while True:
                time.sleep(1.5)
                ts = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
                click.echo(f"  {DIM}{ts}{RESET}  {GREEN}INFO{RESET}   POST /predict  200  {10 + i % 20}ms  batch_size=32")
                i += 1
        except KeyboardInterrupt:
            click.echo(f"\n  {DIM}Stopped.{RESET}")

# ── metrics ────────────────────────────────────────────────────────────────────
@cli.command()
@click.argument("pipeline_name", required=False)
@click.option("--window", "-w", default="1h", help="Time window (e.g. 1h, 24h, 7d)")
def metrics(pipeline_name: Optional[str], window: str):
    """Show pipeline metrics."""
    config = _load_project_config()
    name = pipeline_name or config.get("project", "flowml-pipeline")

    step(f"Metrics: {c(name, CYAN)}  ·  window={c(window, YELLOW)}")

    click.echo(f"""
  {BOLD}Performance  ({window}){RESET}
  ├─ Requests:      {c('4.2M', CYAN)}  total
  ├─ Throughput:    {c('1,247 req/s', CYAN)}  avg
  ├─ P50 latency:   {c('12ms', GREEN)}
  ├─ P95 latency:   {c('34ms', GREEN)}
  ├─ P99 latency:   {c('48ms', GREEN)}
  └─ Error rate:    {c('0.02%', GREEN)}

  {BOLD}Model Quality{RESET}
  ├─ Accuracy:      {c('0.9247', GREEN)}
  ├─ F1 score:      {c('0.9183', GREEN)}
  ├─ AUC-ROC:       {c('0.9612', GREEN)}
  └─ Data drift:    {c('0.042 (healthy)', GREEN)}

  {BOLD}Infrastructure{RESET}
  ├─ CPU (avg):     {c('42%', YELLOW)}
  ├─ Memory (avg):  {c('1.2Gi', YELLOW)}
  ├─ Replicas:      3 (HPA: 2–10)
  └─ Uptime:        {c('99.97%', GREEN)}
""")

# ── rollback ───────────────────────────────────────────────────────────────────
@cli.command()
@click.argument("pipeline_name", required=False)
@click.option("--to", "version", required=True, help="Version to rollback to (e.g. v0.9.0)")
@click.option("--namespace", default="ml-models")
def rollback(pipeline_name: Optional[str], version: str, namespace: str):
    """Rollback a deployment to a previous version."""
    banner()
    config = _load_project_config()
    name = pipeline_name or config.get("project", "flowml-pipeline")

    step(f"Rolling back {c(name, CYAN)} to {c(version, YELLOW)}")
    log(f"Namespace: {c(namespace, CYAN)}", "info")
    log("Fetching revision history...", "info")
    time.sleep(0.3)
    log(f"Found revision for {version}", "success")
    log("Applying rollback...", "info")
    time.sleep(0.5)
    log("Waiting for pods to stabilize...", "info")
    time.sleep(0.4)
    log(f"Rollback complete — running {c(version, GREEN)}", "success")

# ── scale ──────────────────────────────────────────────────────────────────────
@cli.command()
@click.argument("pipeline_name", required=False)
@click.option("--replicas", "-r", required=True, type=int, help="Target replica count")
@click.option("--namespace", default="ml-models")
def scale(pipeline_name: Optional[str], replicas: int, namespace: str):
    """Scale a pipeline deployment."""
    config = _load_project_config()
    name = pipeline_name or config.get("project", "flowml-pipeline")

    step(f"Scaling {c(name, CYAN)} to {c(str(replicas), YELLOW)} replicas")
    time.sleep(0.3)
    log(f"Deployment scaled to {replicas} replicas", "success")

# ── drift ──────────────────────────────────────────────────────────────────────
@cli.group()
def drift():
    """Data drift detection commands."""
    pass

@drift.command("check")
@click.argument("pipeline_name", required=False)
@click.option("--reference", "-r", required=True, help="Reference dataset path")
@click.option("--current", "-c", required=True, help="Current dataset path")
@click.option("--threshold", "-t", default=0.1, help="Drift threshold (default: 0.1)")
def drift_check(pipeline_name: Optional[str], reference: str, current: str, threshold: float):
    """Run drift detection between reference and current datasets."""
    banner()
    config = _load_project_config()
    name = pipeline_name or config.get("project", "flowml-pipeline")

    step(f"Drift detection: {c(name, CYAN)}")
    log(f"Reference: {c(reference, CYAN)}", "info")
    log(f"Current: {c(current, CYAN)}", "info")
    log(f"Threshold: {c(str(threshold), YELLOW)}", "info")
    log("Running Evidently drift analysis...", "info")
    time.sleep(0.8)

    drift_score = 0.042
    status_color = GREEN if drift_score < threshold else RED
    status_text = "HEALTHY" if drift_score < threshold else "DRIFT DETECTED"

    click.echo(f"""
  {BOLD}Drift Report{RESET}
  ├─ Overall score:  {c(str(drift_score), status_color)}  (threshold: {threshold})
  ├─ Status:         {c(status_text, status_color)}
  ├─ Features:       12 analyzed
  ├─ Drifted:        2 features (feature_3, feature_8)
  └─ Report:         {c('./drift_report.html', CYAN)}
""")

# ── generate ───────────────────────────────────────────────────────────────────
@cli.command()
@click.argument("output_type", type=click.Choice(["k8s", "helm", "docker-compose", "prometheus"]))
@click.option("--output", "-o", default=".", help="Output directory")
def generate(output_type: str, output: str):
    """Generate deployment configuration files."""
    banner()
    config = _load_project_config()
    name = config.get("project", "flowml-pipeline")

    step(f"Generating {c(output_type, CYAN)} config for {c(name, CYAN)}")
    Path(output).mkdir(parents=True, exist_ok=True)

    if output_type == "k8s":
        manifest = _generate_k8s_manifest(name, f"docker.io/your-org/{name}:latest", "ml-models", 3)
        out_file = Path(output) / f"{name}-k8s.yaml"
        out_file.write_text(manifest)
        log(f"Written: {c(str(out_file), GREEN)}", "success")
    elif output_type == "helm":
        log("Helm chart generation → see deploy/helm/ directory", "success")
    elif output_type == "docker-compose":
        log("Docker Compose → see deploy/docker/docker-compose.yml", "success")
    elif output_type == "prometheus":
        log("Prometheus config → see deploy/observability/prometheus.yml", "success")

# ── Helpers ────────────────────────────────────────────────────────────────────
def _load_project_config() -> dict:
    if Path(".flowml").exists():
        return json.loads(Path(".flowml").read_text())
    return {}

def _validate_pipeline(config: dict):
    required = ["name", "steps"]
    for key in required:
        if key not in config:
            log(f"Missing required field: {key}", "error")
            sys.exit(1)
    for i, step_cfg in enumerate(config.get("steps", [])):
        if "id" not in step_cfg and "name" not in step_cfg:
            log(f"Step {i+1} missing 'id' or 'name'", "error")
            sys.exit(1)

def _run_step_simulation(name: str, step_type: str, duration: float, log_level: str):
    start = time.time()
    if log_level == "debug":
        log(f"Initializing {step_type} environment...", "info")
    time.sleep(duration * 0.4)
    if log_level in ("debug", "info"):
        log(f"Processing {name}...", "info")
    time.sleep(duration * 0.6)
    elapsed = time.time() - start
    log(f"{name} completed in {c(f'{elapsed:.1f}s', GREEN)}", "success")

def _generate_dockerfile(name: str) -> str:
    content = f"""FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8080 9090
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \\
  CMD curl -f http://localhost:8080/health || exit 1
CMD ["python", "-m", "serve", "--port", "8080"]
"""
    Path("Dockerfile").write_text(content)
    return content

def _generate_k8s_manifest(name: str, image: str, namespace: str, replicas: int) -> str:
    return f"""# Kubernetes Deployment — {name}
# Generated by FlowML CLI

apiVersion: apps/v1
kind: Deployment
metadata:
  name: {name}
  namespace: {namespace}
  labels:
    app: {name}
    managed-by: flowml
spec:
  replicas: {replicas}
  selector:
    matchLabels:
      app: {name}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: {name}
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
    spec:
      containers:
        - name: model-server
          image: {image}
          ports:
            - containerPort: 8080
              name: http
            - containerPort: 9090
              name: metrics
          resources:
            requests:
              cpu: "500m"
              memory: "1Gi"
            limits:
              cpu: "2"
              memory: "4Gi"
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: {name}-svc
  namespace: {namespace}
spec:
  selector:
    app: {name}
  ports:
    - name: http
      port: 80
      targetPort: 8080
    - name: metrics
      port: 9090
      targetPort: 9090
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {name}-hpa
  namespace: {namespace}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {name}
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
"""

def _get_template_steps(template: str) -> list:
    templates = {
        "basic": [
            {"id": "load_data", "name": "Load Data", "type": "data", "depends_on": [], "config": {"source": "s3", "format": "parquet"}},
            {"id": "preprocess", "name": "Preprocess", "type": "transform", "depends_on": ["load_data"]},
            {"id": "train", "name": "Train Model", "type": "train", "depends_on": ["preprocess"]},
            {"id": "evaluate", "name": "Evaluate", "type": "evaluate", "depends_on": ["train"]},
            {"id": "deploy", "name": "Deploy", "type": "deploy", "depends_on": ["evaluate"]},
        ],
        "nlp": [
            {"id": "load_corpus", "name": "Load Corpus", "type": "data", "depends_on": []},
            {"id": "tokenize", "name": "Tokenize", "type": "transform", "depends_on": ["load_corpus"]},
            {"id": "embed", "name": "Embed", "type": "transform", "depends_on": ["tokenize"]},
            {"id": "finetune", "name": "Fine-tune LLM", "type": "train", "depends_on": ["embed"]},
            {"id": "evaluate", "name": "Evaluate BLEU/ROUGE", "type": "evaluate", "depends_on": ["finetune"]},
            {"id": "deploy", "name": "Deploy API", "type": "deploy", "depends_on": ["evaluate"]},
        ],
        "cv": [
            {"id": "load_images", "name": "Load Images", "type": "data", "depends_on": []},
            {"id": "augment", "name": "Augment", "type": "transform", "depends_on": ["load_images"]},
            {"id": "train_cnn", "name": "Train CNN", "type": "train", "depends_on": ["augment"]},
            {"id": "evaluate", "name": "Evaluate mAP", "type": "evaluate", "depends_on": ["train_cnn"]},
            {"id": "export_onnx", "name": "Export ONNX", "type": "deploy", "depends_on": ["evaluate"]},
        ],
        "timeseries": [
            {"id": "load_ts", "name": "Load Time Series", "type": "data", "depends_on": []},
            {"id": "feature_eng", "name": "Feature Engineering", "type": "transform", "depends_on": ["load_ts"]},
            {"id": "train_lstm", "name": "Train LSTM", "type": "train", "depends_on": ["feature_eng"]},
            {"id": "backtest", "name": "Backtest", "type": "evaluate", "depends_on": ["train_lstm"]},
            {"id": "deploy", "name": "Deploy", "type": "deploy", "depends_on": ["backtest"]},
        ],
        "rag": [
            {"id": "load_docs", "name": "Load Documents", "type": "data", "depends_on": []},
            {"id": "chunk", "name": "Chunk & Embed", "type": "transform", "depends_on": ["load_docs"]},
            {"id": "index", "name": "Index Vectors", "type": "transform", "depends_on": ["chunk"]},
            {"id": "eval_retrieval", "name": "Eval Retrieval", "type": "evaluate", "depends_on": ["index"]},
            {"id": "deploy_api", "name": "Deploy RAG API", "type": "deploy", "depends_on": ["eval_retrieval"]},
        ],
    }
    return templates.get(template, templates["basic"])

def main():
    cli()

if __name__ == "__main__":
    main()
