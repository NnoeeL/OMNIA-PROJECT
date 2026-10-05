#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
SUDO=()

if [[ "${EUID}" -ne 0 ]]; then
    if ! command -v sudo >/dev/null 2>&1; then
        printf 'Please install sudo or run this script as root.\n' >&2
        exit 1
    fi
    SUDO=(sudo)
fi

run_privileged() {
    if (("${#SUDO[@]}")); then
        "${SUDO[@]}" "$@"
    else
        "$@"
    fi
}

if ! command -v apt-get >/dev/null 2>&1; then
    printf 'This installer supports Ubuntu/Debian servers with apt-get.\n' >&2
    exit 1
fi

run_privileged apt-get update
run_privileged apt-get install -y ca-certificates curl ffmpeg gnupg

key_file="$(mktemp)"
trap 'rm -f "$key_file"' EXIT
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key -o "$key_file"
run_privileged install -d -m 0755 /etc/apt/keyrings
run_privileged gpg --dearmor --yes --output /etc/apt/keyrings/nodesource.gpg "$key_file"
run_privileged chmod a+r /etc/apt/keyrings/nodesource.gpg
printf '%s\n' 'deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main' |
    run_privileged tee /etc/apt/sources.list.d/nodesource.list >/dev/null
run_privileged apt-get update
run_privileged apt-get install -y nodejs

case "$(uname -m)" in
    x86_64|amd64) ytdlp_asset='yt-dlp_linux' ;;
    aarch64|arm64) ytdlp_asset='yt-dlp_linux_aarch64' ;;
    *)
        printf 'Unsupported CPU architecture for the yt-dlp binary: %s\n' "$(uname -m)" >&2
        exit 1
        ;;
esac

mkdir -p "$ROOT_DIR/bin" "$ROOT_DIR/sessions" "$ROOT_DIR/temp" \
    "$ROOT_DIR/backups" "$ROOT_DIR/src/database"
yt_dlp_tmp="$(mktemp)"
trap 'rm -f "$key_file" "$yt_dlp_tmp"' EXIT
curl -fL "https://github.com/yt-dlp/yt-dlp/releases/latest/download/${ytdlp_asset}" -o "$yt_dlp_tmp"
install -m 0755 "$yt_dlp_tmp" "$ROOT_DIR/bin/yt-dlp"

if [[ ! -f "$ROOT_DIR/.env" ]]; then
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
    chmod 600 "$ROOT_DIR/.env"
    printf 'Created .env from .env.example. Add your WhatsApp and API settings before starting the bot.\n'
fi

cd "$ROOT_DIR"
npm ci --omit=dev
printf 'VPS dependencies installed. Configure .env, then start with: npm start\n'
