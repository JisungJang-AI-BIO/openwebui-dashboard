# Open WebUI Upgrade Guide

Procedure for upgrading Open WebUI on the internal production server.

---

## Prerequisites

- Open WebUI is installed via pip (`pip install open-webui[all]`)
- Existing PostgreSQL DB will be reused as-is
- Open WebUI automatically runs DB migrations via Alembic on startup

---

## Upgrade Procedure

### 1. Check Current Version

```bash
pip show open-webui | grep Version
```

### 2. Stop Open WebUI

Terminate the running Open WebUI process.

```bash
pkill -f "open-webui serve"
```

### 3. Back Up the Database

Always back up before upgrading. Major version changes may include DB schema migrations, so you need to be able to roll back if issues arise.

```bash
# Docker environment
docker exec <container> pg_dump -U <db_user> -d <db_name> -F c -f /tmp/backup.dump
docker cp <container>:/tmp/backup.dump ./backups/openwebui_backup_$(date +%Y%m%d_%H%M%S).dump
docker exec <container> rm /tmp/backup.dump

# Development environment example
docker exec openwebui-postgres pg_dump -U openwebui_admin -d openwebui -F c -f /tmp/backup.dump
docker cp openwebui-postgres:/tmp/backup.dump ./backups/openwebui_backup_$(date +%Y%m%d_%H%M%S).dump
docker exec openwebui-postgres rm /tmp/backup.dump
```

### 4. Upgrade via pip

```bash
pip install --upgrade "open-webui[all]"
```

To upgrade to a specific version:

```bash
pip install "open-webui[all]==0.8.0"
```

### 5. Verify the Upgrade

```bash
pip show open-webui | grep Version
```

### 6. Start Open WebUI

Run the existing startup script or command as usual.

```bash
bash start_openwebui.sh
```

Verify the following in the startup logs:
- **Version**: `v0.8.0` banner displayed
- **DB connection**: `Connected to PostgreSQL database`
- **Migrations**: `Running upgrade ... -> ...` (automatically executed if schema changes exist)
- **Server start**: `Started server process`

---

## Rollback Procedure

If issues occur after upgrading:

### 1. Stop Open WebUI

```bash
pkill -f "open-webui serve"
```

### 2. Reinstall the Previous Version

```bash
pip install "open-webui[all]==0.7.2"  # specify previous version
```

### 3. Restore the Database

Since migrations may have changed the schema, restore from the backup.

```bash
docker cp ./backups/openwebui_backup_XXXXXXXX_XXXXXX.dump <container>:/tmp/backup.dump
docker exec <container> dropdb -U <db_user> <db_name>
docker exec <container> createdb -U <db_user> <db_name>
docker exec <container> pg_restore -U <db_user> -d <db_name> /tmp/backup.dump
docker exec <container> rm /tmp/backup.dump
```

### 4. Start Open WebUI

```bash
bash start_openwebui.sh
```

---

## Notes

- **DB migrations are automatic**: On startup, Alembic checks the current schema version and applies any required migrations sequentially. No manual SQL execution is needed.
- **No DATABASE_URL change required**: Use the existing PostgreSQL connection settings as-is.
- **Check release notes**: Major version upgrades may contain breaking changes. Review https://github.com/open-webui/open-webui/releases before upgrading.
- **Docker deployments**: If running via Docker image, simply change the image tag in `docker-compose.yml` for the same effect.
