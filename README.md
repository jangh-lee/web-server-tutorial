# NGINX Load Balancer Lab

Ubuntu 서버에서 `nginx` 기반으로 아주 단순한 백엔드 노드를 띄우기 위한 실습용 예제입니다.

로드밸런서 뒤에 여러 대를 붙여두고 새로고침하거나 트래픽을 분산시키면, 어떤 백엔드가 응답했는지 바로 확인할 수 있습니다.

## 화면에 표시되는 정보

- 날짜
- 시간
- 설치 시 입력한 이름
- 호스트명
- IP 정보

## 헬스체크 경로

- `GET /healthz`

## 구성 파일

- `install.sh`: Ubuntu 서버 설치 스크립트
- `update_status.sh`: 상태 JSON 갱신 스크립트
- `templates/index.html.template`: 정적 HTML 템플릿

## 설치 방법

서버에서 아래처럼 실행하면 됩니다.

```bash
cd /path/to/repo
chmod +x install.sh
sudo ./install.sh
```

설치 중 이름을 입력하면 그 값이 페이지에 표시됩니다. 예를 들어 `node-1`, `node-2`, `node-3`처럼 각각 다르게 넣어두면 로드밸런서 실습에 편합니다.

## 공개 리포 사용자용 복붙 스크립트

```bash
sudo apt-get update && sudo apt-get install -y git
git clone https://github.com/jangh-lee/nginx-loadbalancer-lab.git
cd nginx-loadbalancer-lab
chmod +x install.sh
sudo ./install.sh
```

## 설치 후 확인

```bash
curl http://localhost/healthz
curl http://localhost/status.json
```

브라우저에서는 아래 주소로 접속합니다.

```text
http://SERVER_IP/
```

## 동작 방식

- `nginx`가 `/var/www/lb-demo`의 정적 파일을 서비스합니다.
- `systemd timer`가 1분마다 `status.json`을 갱신합니다.
- 메인 페이지는 `/status.json`을 읽어 날짜, 시간, 이름, 호스트명, IP 정보를 표시합니다.
