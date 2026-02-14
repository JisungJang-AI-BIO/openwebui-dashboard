# Open WebUI 업그레이드 가이드

사내 운영 서버에서 Open WebUI를 업그레이드하는 절차입니다.

---

## 전제 조건

- Open WebUI가 pip으로 설치되어 있음 (`pip install open-webui[all]`)
- 기존 PostgreSQL DB를 그대로 재사용
- Open WebUI는 시작 시 Alembic을 통해 DB 마이그레이션을 자동 수행함

---

## 업그레이드 절차

### 1. 현재 버전 확인

```bash
pip show open-webui | grep Version
```

### 2. Open WebUI 중지

실행 중인 Open WebUI 프로세스를 종료한다.

```bash
# PID로 종료
pkill -f "open-webui serve"
```

### 3. DB 백업

업그레이드 전 반드시 백업한다. 메이저 버전 변경 시 DB 스키마 마이그레이션이 포함될 수 있으므로, 문제 발생 시 롤백할 수 있어야 한다.

```bash
# Docker 환경
docker exec <컨테이너명> pg_dump -U <DB유저> -d <DB명> -F c -f /tmp/backup.dump
docker cp <컨테이너명>:/tmp/backup.dump ./backups/openwebui_backup_$(date +%Y%m%d_%H%M%S).dump
docker exec <컨테이너명> rm /tmp/backup.dump

# 개발 환경 예시
docker exec openwebui-postgres pg_dump -U openwebui_admin -d openwebui -F c -f /tmp/backup.dump
docker cp openwebui-postgres:/tmp/backup.dump ./backups/openwebui_backup_$(date +%Y%m%d_%H%M%S).dump
docker exec openwebui-postgres rm /tmp/backup.dump
```

### 4. pip 업그레이드

```bash
pip install --upgrade "open-webui[all]"
```

특정 버전으로 업그레이드하려면:

```bash
pip install "open-webui[all]==0.8.0"
```

### 5. 업그레이드 확인

```bash
pip show open-webui | grep Version
```

### 6. Open WebUI 시작

기존 실행 스크립트 또는 명령어로 그대로 실행한다.

```bash
bash start_openwebui.sh
```

시작 시 로그에서 다음을 확인:
- **버전**: `v0.8.0` 배너 출력
- **DB 연결**: `Connected to PostgreSQL database`
- **마이그레이션**: `Running upgrade ... -> ...` (스키마 변경이 있을 경우 자동 실행)
- **서버 시작**: `Started server process`

---

## 롤백 절차

업그레이드 후 문제가 발생한 경우:

### 1. Open WebUI 중지

```bash
pkill -f "open-webui serve"
```

### 2. 이전 버전 재설치

```bash
pip install "open-webui[all]==0.7.2"  # 이전 버전 지정
```

### 3. DB 복원

마이그레이션으로 스키마가 변경되었으므로 백업에서 복원해야 한다.

```bash
docker cp ./backups/openwebui_backup_XXXXXXXX_XXXXXX.dump <컨테이너명>:/tmp/backup.dump
docker exec <컨테이너명> dropdb -U <DB유저> <DB명>
docker exec <컨테이너명> createdb -U <DB유저> <DB명>
docker exec <컨테이너명> pg_restore -U <DB유저> -d <DB명> /tmp/backup.dump
docker exec <컨테이너명> rm /tmp/backup.dump
```

### 4. Open WebUI 시작

```bash
bash start_openwebui.sh
```

---

## 참고사항

- **DB 마이그레이션은 자동**: Open WebUI가 시작할 때 Alembic이 현재 스키마 버전을 확인하고 필요한 마이그레이션을 순차 적용한다. 수동 SQL 실행이 필요 없다.
- **DATABASE_URL 변경 불필요**: 기존 PostgreSQL 접속 정보를 그대로 사용하면 된다.
- **릴리스 노트 확인 권장**: 메이저 버전 업그레이드 시 breaking changes가 있을 수 있으므로 https://github.com/open-webui/open-webui/releases 를 확인한다.
- **Docker 배포 환경**: Docker 이미지로 운영하는 경우 `docker-compose.yml`의 이미지 태그만 변경하면 동일한 효과를 얻을 수 있다.
