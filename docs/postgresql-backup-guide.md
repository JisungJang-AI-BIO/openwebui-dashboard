# PostgreSQL DB Backup Guide

## Environment

- PostgreSQL: Docker container (`openwebui-postgres`)
- Volume: Docker named volume (`openwebui_pgdata`)
- Connection: `localhost:5435`

## 1. Manual Backup (pg_dump)

### Full DB Backup

```bash
docker exec openwebui-postgres pg_dump -U openwebui_admin -d openwebui -F c -f /tmp/openwebui_backup.dump
docker cp openwebui-postgres:/tmp/openwebui_backup.dump ./backups/openwebui_backup_$(date +%Y%m%d_%H%M%S).dump
```

### SQL Text Format Backup

```bash
docker exec openwebui-postgres pg_dump -U openwebui_admin -d openwebui > ./backups/openwebui_backup_$(date +%Y%m%d_%H%M%S).sql
```

## 2. Restore

### Custom Format (.dump) Restore

```bash
# Recreate DB and restore
docker exec openwebui-postgres dropdb -U openwebui_admin openwebui
docker exec openwebui-postgres createdb -U openwebui_admin openwebui
docker cp ./backups/openwebui_backup.dump openwebui-postgres:/tmp/openwebui_backup.dump
docker exec openwebui-postgres pg_restore -U openwebui_admin -d openwebui /tmp/openwebui_backup.dump
```

### SQL Text Format Restore

```bash
docker exec openwebui-postgres dropdb -U openwebui_admin openwebui
docker exec openwebui-postgres createdb -U openwebui_admin openwebui
docker exec -i openwebui-postgres psql -U openwebui_admin -d openwebui < ./backups/openwebui_backup.sql
```

## 3. One-Click Backup Script

Use `backup_db.sh`:

```bash
./backup_db.sh
```

## 4. Docker Named Volume Direct Backup

Back up the entire volume as a tar archive while the container is stopped:

```bash
docker run --rm -v openwebui-dashboard_openwebui_pgdata:/data -v $(pwd)/backups:/backup alpine tar czf /backup/pgdata_volume_$(date +%Y%m%d).tar.gz -C /data .
```

## 5. Notes

- Backup files are stored in the `backups/` directory (included in `.gitignore`)
- When backing up the production DB, consider using `--no-owner` (to handle ownership differences)
- It is recommended to back up before rebooting Windows
