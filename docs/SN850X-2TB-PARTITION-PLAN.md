# WD Black SN850X 2TB PCIe 4.0 — APFS Volume Plan

> Host: yyc3-22 (M4 Max 128GB)
> Interface: Thunderbolt 5 NVMe Enclosure
> Filesystem: APFS Container (single container, multiple volumes)
> Backup: NAS handles all — snapshots, Time Machine, rsync

## Why APFS Volumes (Not Partitions)

APFS volumes within a single container **share free space dynamically**.
- No risk of one partition running full while another is empty
- Instant clone/snapshot support
- Per-volume encryption optional
- macOS native, zero overhead

## Volume Layout

```
┌──────────────────────────────────────────────────┐
│  APFS Container: SN850X-2TB (diskXs2)            │
│  Total: 2,000 GB | Encryption: FileVault OFF     │
│  (NAS handles security; local = max speed)        │
├──────────────────────────────────────────────────┤
│                                                    │
│  Volume 1: YYC3-PGDATA                            │
│  Reserved: 400 GB (soft limit via quota)           │
│  Mount: /Volumes/YYC3-PGDATA                      │
│  Purpose:                                          │
│    - PostgreSQL 15 data directory                  │
│    - WAL logs (pg_wal)                             │
│    - pg_stat_tmp (RAM-backed via tmpfs ideally)    │
│    - Tablespaces for hot/cold data separation      │
│  PG Config:                                        │
│    data_directory = '/Volumes/YYC3-PGDATA/15'     │
│    unix_socket_directories = '/tmp'                │
│  Notes:                                            │
│    - SN850X sequential write 6,600 MB/s            │
│    - Perfect for WAL + checkpoint write bursts     │
│    - Set random_page_cost = 1.1 (NVMe-aware)      │
│                                                    │
├──────────────────────────────────────────────────┤
│                                                    │
│  Volume 2: YYC3-WORKSPACE                         │
│  Reserved: 600 GB                                  │
│  Mount: /Volumes/YYC3-WORKSPACE                   │
│  Purpose:                                          │
│    - Project source: yyc3-ai-family/               │
│    - node_modules, bun.lockb                       │
│    - Build artifacts (dist/, .next/)               │
│    - Git repository (.git/)                        │
│    - Multiple project clones for parallel work     │
│  Symlink from home:                                │
│    ~/Projects → /Volumes/YYC3-WORKSPACE/projects  │
│                                                    │
├──────────────────────────────────────────────────┤
│                                                    │
│  Volume 3: YYC3-MODELS                            │
│  Reserved: 500 GB                                  │
│  Mount: /Volumes/YYC3-MODELS                      │
│  Purpose:                                          │
│    - Ollama model storage (~30GB per 30B model)    │
│      qwen3-coder:30b, deepseek-coder:33b,         │
│      llama3.2 variants, embedding models           │
│    - HuggingFace cache (~/.cache/huggingface)      │
│    - GGUF model files for llama.cpp                │
│    - Fine-tuning datasets & checkpoints            │
│  Config:                                           │
│    OLLAMA_MODELS=/Volumes/YYC3-MODELS/ollama      │
│    HF_HOME=/Volumes/YYC3-MODELS/huggingface       │
│                                                    │
├──────────────────────────────────────────────────┤
│                                                    │
│  Volume 4: YYC3-KNOWLEDGE                         │
│  Reserved: 200 GB                                  │
│  Mount: /Volumes/YYC3-KNOWLEDGE                   │
│  Purpose:                                          │
│    - Knowledge base document store                 │
│    - Vector DB file storage (if using Qdrant/etc)  │
│    - Embedding cache (pre-computed vectors)         │
│    - Processed document cache (PDF→text, etc)       │
│    - RAG index files                               │
│  Config:                                           │
│    KB_STORAGE_DIR=/Volumes/YYC3-KNOWLEDGE/kb      │
│                                                    │
├──────────────────────────────────────────────────┤
│                                                    │
│  Volume 5: YYC3-LOGS                              │
│  Reserved: 200 GB                                  │
│  Mount: /Volumes/YYC3-LOGS                        │
│  Purpose:                                          │
│    - Server logs (structured JSON)                 │
│    - PostgreSQL logs (pg_log/)                     │
│    - Prometheus TSDB (if local)                    │
│    - Agent call audit trail exports                │
│    - CI/CD build logs                              │
│  Config:                                           │
│    LOG_FILE_PATH=/Volumes/YYC3-LOGS/server.log    │
│    PG: log_directory = '/Volumes/YYC3-LOGS/pg'    │
│  Rotation:                                         │
│    - logrotate: 50MB per file, 30 files max        │
│    - Auto-prune: server maintenance() every 30min  │
│                                                    │
├──────────────────────────────────────────────────┤
│                                                    │
│  Volume 6: YYC3-SCRATCH                           │
│  Reserved: 100 GB (dynamic, uses remaining space)  │
│  Mount: /Volumes/YYC3-SCRATCH                     │
│  Purpose:                                          │
│    - Temporary build cache                         │
│    - Bun cache (~/.bun/install/cache)              │
│    - Docker images (if using OrbStack)             │
│    - Benchmark data                                │
│    - Experimental / throwaway                      │
│  Auto-clean:                                       │
│    - Weekly cron: find /Volumes/YYC3-SCRATCH       │
│      -type f -mtime +7 -delete                    │
│                                                    │
└──────────────────────────────────────────────────┘
```

## Creation Commands

```bash
# All volumes in one APFS container on the SN850X
# Identify your disk first:
diskutil list  # Find SN850X (e.g., disk4)

# Format entire disk as APFS container
diskutil apfs createContainer /dev/disk4

# Add volumes (APFS shares space, no fixed sizes needed)
DISK="disk4"  # Adjust to your SN850X identifier

diskutil apfs addVolume $DISK APFS "YYC3-PGDATA"
diskutil apfs addVolume $DISK APFS "YYC3-WORKSPACE"
diskutil apfs addVolume $DISK APFS "YYC3-MODELS"
diskutil apfs addVolume $DISK APFS "YYC3-KNOWLEDGE"
diskutil apfs addVolume $DISK APFS "YYC3-LOGS"
diskutil apfs addVolume $DISK APFS "YYC3-SCRATCH"

# Optional: Set quota (soft space reservation)
# diskutil apfs setQuota YYC3-PGDATA 400g
# diskutil apfs setQuota YYC3-MODELS 500g
```

## PostgreSQL 15 Setup on SN850X

```bash
# 1. Move PG data to SN850X
brew services stop postgresql@15

# Init new data directory on NVMe
initdb -D /Volumes/YYC3-PGDATA/15 \
  --encoding=UTF8 \
  --locale=en_US.UTF-8 \
  --username=yyc3_max

# 2. Configure postgresql.conf
cat >> /Volumes/YYC3-PGDATA/15/postgresql.conf << 'EOF'

# ── YYC³ M4 Max 128GB + SN850X Tuning ──
# Connections
port = 5433
max_connections = 100
superuser_reserved_connections = 3

# Memory (128GB total → PG gets 32GB)
shared_buffers = '8GB'
effective_cache_size = '96GB'
work_mem = '256MB'
maintenance_work_mem = '2GB'
wal_buffers = '64MB'
huge_pages = try

# WAL (SN850X PCIe 4.0: 6.6GB/s write)
wal_level = replica
max_wal_size = '4GB'
min_wal_size = '1GB'
checkpoint_completion_target = 0.9
checkpoint_timeout = 15min

# NVMe-aware Query Planner
random_page_cost = 1.1
effective_io_concurrency = 200
seq_page_cost = 1.0

# M4 Max Parallelism (16P + 40E cores)
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_worker_processes = 16
parallel_tuple_cost = 0.01
parallel_setup_cost = 100

# Logging → SN850X-LOGS volume
log_directory = '/Volumes/YYC3-LOGS/pg'
logging_collector = on
log_min_duration_statement = 500
log_checkpoints = on
log_lock_waits = on
log_temp_files = 0

# Stats
track_activities = on
track_counts = on
track_io_timing = on

# Autovacuum (aggressive for high-insert workload)
autovacuum_max_workers = 4
autovacuum_naptime = 30s
autovacuum_vacuum_cost_delay = 2ms
EOF

# 3. Configure pg_hba.conf (local trust for dev)
cat >> /Volumes/YYC3-PGDATA/15/pg_hba.conf << 'EOF'
# YYC³ connections
local   all   yyc3_max                        trust
host    all   yyc3_max   127.0.0.1/32         trust
host    all   yyc3_max   ::1/128              trust
host    all   yyc3_max   192.168.3.0/24       md5
EOF

# 4. Create log directory
mkdir -p /Volumes/YYC3-LOGS/pg

# 5. Start with new data directory
pg_ctl -D /Volumes/YYC3-PGDATA/15 start

# 6. Create database + apply schema
createdb -p 5433 -U yyc3_max yyc3_family
psql -p 5433 -U yyc3_max -d yyc3_family < supabase/family-schema.sql

# 7. Or use bun scripts:
cd bun-server
bun run db:init --pg-create
bun run db:init --pg-extensions
bun run db:init --verify
```

## Symlinks for Developer Ergonomics

```bash
# Quick access from home
ln -s /Volumes/YYC3-WORKSPACE/projects ~/Projects
ln -s /Volumes/YYC3-PGDATA/15 ~/pgdata

# Ollama models on NVMe
mkdir -p /Volumes/YYC3-MODELS/ollama
# Add to ~/.zshrc:
export OLLAMA_MODELS=/Volumes/YYC3-MODELS/ollama

# Bun cache on NVMe (faster installs)
mkdir -p /Volumes/YYC3-SCRATCH/bun-cache
export BUN_INSTALL_CACHE_DIR=/Volumes/YYC3-SCRATCH/bun-cache
```

## NAS Backup Strategy (Reference)

Since NAS handles all persistence:
- **Time Machine**: Internal SSD → NAS (hourly)
- **Synology Snapshot**: YYC3-PGDATA → NAS (every 4h)
- **pg_basebackup**: Nightly cron → NAS share
  ```bash
  # Crontab: daily 3AM PG backup to NAS
  0 3 * * * pg_basebackup -p 5433 -U yyc3_max -D /Volumes/NAS/backups/pg/$(date +\%Y\%m\%d) -Ft -z -P
  ```
- **Rsync**: YYC3-WORKSPACE → NAS (every 2h, excludes node_modules)
- **SN850X is expendable**: All data is reconstructible from NAS

## .env Update for SN850X Paths

```bash
# Add to bun-server/.env
DATABASE_URL=postgresql://yyc3_max:yyc3_max@localhost:5433/yyc3_family
SQLITE_DB_PATH=/Volumes/YYC3-PGDATA/sqlite-fallback/yyc3-family.db
KB_STORAGE_DIR=/Volumes/YYC3-KNOWLEDGE/kb
LOG_FILE_ENABLED=true
LOG_FILE_PATH=/Volumes/YYC3-LOGS/server.log
OLLAMA_MODELS=/Volumes/YYC3-MODELS/ollama
```
