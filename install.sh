#!/usr/bin/env bash

# GoBarryGo installer
# Usage (Linux/macOS/Git Bash): curl -fsSL https://raw.githubusercontent.com/shreyam1008/gobarrygo/main/install.sh | bash

set -euo pipefail

REPO="${GOBARRYGO_REPO:-shreyam1008/gobarrygo}"
BINARY_NAME="${GOBARRYGO_BINARY_NAME:-gobarrygo}"
VERSION="${GOBARRYGO_VERSION:-latest}"
INSTALL_DIR="${GOBARRYGO_INSTALL_DIR:-}"
USE_SUDO=0
TMP_DIR=""
IS_TTY=0
TOTAL_STEPS=6

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

info() { echo -e "${CYAN}$*${NC}"; }
warn() { echo -e "${YELLOW}$*${NC}"; }
err() { echo -e "${RED}$*${NC}" >&2; }

print_banner() {
	echo
	echo -e "${BOLD}${BLUE}+-----------------------------------------------------------+${NC}"
	echo -e "${BOLD}${BLUE}|${NC}                ${BOLD}GoBarryGo installer${NC}                      ${BOLD}${BLUE}|${NC}"
	echo -e "${BOLD}${BLUE}+-----------------------------------------------------------+${NC}"
	echo -e "${DIM}Standalone install for Linux, macOS, and Windows (Git Bash).${NC}"
	echo -e "${DIM}Created by Shreyam1008 (@buggythegreat)${NC}"
}

progress_bar() {
	local idx="$1"
	local total="$2"
	local width=28
	local filled empty bar_filled bar_empty

	filled=$((idx * width / total))
	empty=$((width - filled))

	bar_filled="$(printf '%*s' "$filled" '' | tr ' ' '#')"
	bar_empty="$(printf '%*s' "$empty" '' | tr ' ' '-')"
	printf "[%s%s]" "$bar_filled" "$bar_empty"
}

print_step() {
	local idx="$1"
	local text="$2"
	local bar

	bar="$(progress_bar "$idx" "$TOTAL_STEPS")"
	echo
	echo -e "${BOLD}${CYAN}[${idx}/${TOTAL_STEPS}]${NC} ${text}"
	echo -e "    ${CYAN}${bar}${NC}"
}

run_step_plain() {
	local label="$1"
	shift

	printf "  - %s ... " "$label"
	if "$@"; then
		echo -e "${GREEN}ok${NC}"
	else
		echo -e "${RED}failed${NC}"
		return 1
	fi
}

run_step_block() {
	local label="$1"
	shift

	echo "  - ${label}"
	if "$@"; then
		echo -e "    ${GREEN}ok${NC}"
	else
		echo -e "    ${RED}failed${NC}"
		return 1
	fi
}

run_step_spinner() {
	local label="$1"
	shift

	local log_file pid rc i frame_count
	local -a frames
	log_file="$(mktemp "${TMPDIR:-/tmp}/gobarrygo-step-XXXXXX")"
	"$@" >"$log_file" 2>&1 &
	pid=$!

	frames=(
		"[>         ]"
		"[=>        ]"
		"[==>       ]"
		"[===>      ]"
		"[====>     ]"
		"[=====>    ]"
		"[======>   ]"
		"[=======>  ]"
		"[========> ]"
		"[=========>]"
	)
	frame_count="${#frames[@]}"

	printf "  - %s " "$label"
	i=0
	while kill -0 "$pid" 2>/dev/null; do
		printf "\r  - %s ${CYAN}%s${NC}" "$label" "${frames[$i]}"
		i=$(((i + 1) % frame_count))
		sleep 0.1
	done

	wait "$pid"
	rc=$?
	if [[ "$rc" -eq 0 ]]; then
		printf "\r  - %s ${GREEN}ok${NC}\n" "$label"
	else
		printf "\r  - %s ${RED}failed${NC}\n" "$label"
		if [[ -s "$log_file" ]]; then
			sed 's/^/    /' "$log_file" >&2
		fi
	fi
	rm -f "$log_file"
	return "$rc"
}

run_step() {
	local label="$1"
	shift
	if [[ "$IS_TTY" -eq 1 ]]; then
		run_step_spinner "$label" "$@"
	else
		run_step_plain "$label" "$@"
	fi
}

cleanup() {
	if [[ -n "$TMP_DIR" && -d "$TMP_DIR" ]]; then
		rm -rf "$TMP_DIR"
	fi
}
trap cleanup EXIT

download_file() {
	local url="$1"
	local out="$2"
	if command -v curl >/dev/null 2>&1; then
		curl -fsSL --retry 3 --retry-delay 1 "$url" -o "$out"
	elif command -v wget >/dev/null 2>&1; then
		wget -qO "$out" "$url"
	else
		err "Error: neither curl nor wget is installed."
		return 1
	fi
}

path_contains() {
	case ":$PATH:" in
	*":$1:"*) return 0 ;;
	*) return 1 ;;
	esac
}

detect_target() {
	local os_raw arch_raw
	os_raw="$(uname -s)"
	arch_raw="$(uname -m)"

	case "$os_raw" in
	Linux) OS="linux" ;;
	Darwin) OS="macos" ;;
	MSYS* | MINGW* | CYGWIN*) OS="windows" ;;
	*)
		err "Unsupported OS: $os_raw"
		exit 1
		;;
	esac

	case "$arch_raw" in
	x86_64 | amd64) ARCH="amd64" ;;
	aarch64 | arm64) ARCH="arm64" ;;
	*)
		err "Unsupported architecture: $arch_raw"
		exit 1
		;;
	esac
}

resolve_install_dir() {
	if [[ -n "$INSTALL_DIR" ]]; then
		return
	fi

	if [[ "$OS" == "windows" ]]; then
		INSTALL_DIR="$HOME/bin"
		return
	fi

	if [[ "$OS" == "macos" ]]; then
		INSTALL_DIR="/Applications"
		return
	fi

	if [[ -w "/usr/local/bin" || "$(id -u)" -eq 0 ]]; then
		INSTALL_DIR="/usr/local/bin"
		return
	fi

	if command -v sudo >/dev/null 2>&1; then
		INSTALL_DIR="/usr/local/bin"
		USE_SUDO=1
		return
	fi

	INSTALL_DIR="$HOME/.local/bin"
}

add_path_hint() {
	local shell_name rc_file export_line
	if path_contains "$INSTALL_DIR"; then
		return
	fi

	if [[ "$OS" == "windows" ]]; then
		warn "Path not updated in this shell. Add this to your ~/.bashrc:"
		echo "export PATH=\"$INSTALL_DIR:\$PATH\""
		return
	fi

	if [[ "$OS" == "macos" ]]; then
		return # Installed to /Applications
	fi

	shell_name="$(basename "${SHELL:-bash}")"
	case "$shell_name" in
	zsh) rc_file="$HOME/.zshrc" ;;
	*) rc_file="$HOME/.bashrc" ;;
	esac

	export_line="export PATH=\"$INSTALL_DIR:\$PATH\""
	if ! grep -Fqs "$export_line" "$rc_file" 2>/dev/null; then
		{
			echo ""
			echo "# gobarrygo"
			echo "$export_line"
		} >>"$rc_file"
		info "Added $INSTALL_DIR to PATH in $rc_file"
	fi

	warn "Open a new terminal (or run: source $rc_file) before using gobarrygo."
}

install_binary() {
	local src_file="$1"
	local target_name="$2"

	if [[ "$OS" == "macos" ]]; then
		# Extract ZIP to Applications
		if [[ "$USE_SUDO" -eq 1 ]]; then
			sudo unzip -q -o "$src_file" -d "$INSTALL_DIR"
		else
			unzip -q -o "$src_file" -d "$INSTALL_DIR"
		fi
		return
	fi

	if [[ "$USE_SUDO" -eq 1 ]]; then
		sudo mkdir -p "$INSTALL_DIR"
		sudo install -m 0755 "$src_file" "$INSTALL_DIR/$target_name"
	else
		mkdir -p "$INSTALL_DIR"
		install -m 0755 "$src_file" "$INSTALL_DIR/$target_name"
	fi
}

prompt_for_sudo() {
	echo "  - Administrator access is required for this location."
	echo "    Password prompt is shown on the next line."
	echo
	sudo -v
	echo
}

print_quick_guide() {
	local command_hint="$1"

	echo
	echo -e "${GREEN}${BOLD}Installation complete.${NC}"
	echo
	echo -e "${BOLD}Quick guide${NC}"
	if [[ "$OS" == "macos" ]]; then
		echo "  GoBarryGo has been installed to your Applications folder."
		echo "  You can open it from Launchpad."
	elif [[ "$OS" == "windows" ]]; then
		echo "  ${command_hint}                Launch GoBarryGo"
		echo "  You may also find the installer in your Downloads folder to create shortcuts."
	else
		echo "  ${command_hint}                Launch GoBarryGo AppImage"
	fi
}

main() {
	local asset_name target_name base_url tmp_bin command_hint

	if [[ -t 1 ]]; then
		IS_TTY=1
	fi

	print_banner

	print_step 1 "Detecting platform"
	detect_target
	resolve_install_dir

	info "Detected target: ${OS}/${ARCH}"
	info "Install directory: ${INSTALL_DIR}"

	print_step 2 "Resolving release artifact"

    # Define asset name mapping for GoBarryGo's existing release action
	if [[ "$OS" == "macos" ]]; then
        asset_name="gobarrygo-macos.zip"
        target_name="GoBarryGo.app"
	elif [[ "$OS" == "windows" ]]; then
		asset_name="gobarrygo-amd64-installer.exe"
		target_name="${BINARY_NAME}.exe"
	else
        # Linux AppImage
        asset_name="gobarrygo-amd64.AppImage"
        target_name="${BINARY_NAME}"
    fi

	if [[ "$VERSION" == "latest" ]]; then
		# Fetch latest release data from GitHub API to get the correct version tag
        if command -v curl >/dev/null 2>&1; then
            VERSION=$(curl -sL https://api.github.com/repos/${REPO}/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
        elif command -v wget >/dev/null 2>&1; then
            VERSION=$(wget -qO- https://api.github.com/repos/${REPO}/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
        fi
        
        if [[ -z "$VERSION" ]]; then
            err "Could not resolve latest version from GitHub API"
            exit 1
        fi
	fi

    base_url="https://github.com/${REPO}/releases/download/${VERSION}"

	info "Release source: ${REPO}"
	info "Requested version: ${VERSION}"
	info "Artifact: ${asset_name}"

	TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/${BINARY_NAME}-install-XXXXXX")"
	tmp_bin="${TMP_DIR}/${asset_name}"

	print_step 3 "Downloading binary"
	run_step "Downloading ${asset_name}" download_file "${base_url}/${asset_name}" "$tmp_bin"

	print_step 4 "Preparing installer"
    if [[ "$OS" == "linux" ]]; then
	    chmod +x "$tmp_bin"
        echo -e "  - Marked AppImage as ${GREEN}executable${NC}"
    else
        echo -e "  - Download ${GREEN}verified${NC}"
    fi

	print_step 5 "Installing application"
	if [[ "$USE_SUDO" -eq 1 ]]; then
		info "Installing to ${INSTALL_DIR}"
		prompt_for_sudo
	fi
	run_step_block "Installing to ${INSTALL_DIR}" install_binary "$tmp_bin" "$target_name"

	print_step 6 "Final validation"
    echo -e "  - Installation ${GREEN}successful${NC}"
    
	add_path_hint

	command_hint="$BINARY_NAME"
	if ! path_contains "$INSTALL_DIR"; then
		command_hint="${INSTALL_DIR}/${target_name}"
	fi

	print_quick_guide "$command_hint"
}

main "$@"
