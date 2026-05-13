# Smoke-test image for coc-toml.
#
# Builds the extension from local sources, installs Neovim + coc.nvim, and
# pre-installs the Tombi CLI so fixture-driven scenarios can verify
# project-level config (tombi.toml) behavior without a live LSP session.
#
# Build:
#   docker build -t coc-toml-test .
#   # or: podman build -t coc-toml-test .
#
# Default smoke test (build artifact + tombi binary):
#   docker run --rm coc-toml-test
#
# All scenarios (no-config + with-config v1.0 / v1.1):
#   docker run --rm coc-toml-test all
#
# Individual scenarios:
#   docker run --rm coc-toml-test no-config
#   docker run --rm coc-toml-test with-config-v1.0
#   docker run --rm coc-toml-test with-config-v1.1
#
# Interactive shell (manual poke):
#   docker run --rm -it --entrypoint bash coc-toml-test
#
# Open the sample TOML in nvim:
#   docker run --rm -it coc-toml-test nvim /work/examples/test.toml

FROM node:24-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    NO_COLOR=1 \
    PNPM_HOME=/root/.local/share/pnpm \
    PATH=/root/.local/share/pnpm:$PATH

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      git \
      xz-utils \
 && rm -rf /var/lib/apt/lists/*

# Debian bookworm ships neovim 0.7.2; current coc.nvim requires >= 0.8.
# Pull a recent stable release from upstream instead.
ARG NVIM_VERSION=v0.10.4
RUN ARCH=$(uname -m) \
 && curl -fsSL "https://github.com/neovim/neovim/releases/download/${NVIM_VERSION}/nvim-linux-${ARCH}.tar.gz" \
      -o /tmp/nvim.tar.gz \
 && tar -xzf /tmp/nvim.tar.gz -C /opt \
 && ln -s "/opt/nvim-linux-${ARCH}/bin/nvim" /usr/local/bin/nvim \
 && rm /tmp/nvim.tar.gz \
 && nvim --version | head -1

# Pre-install tombi on PATH so the extension's bootstrap takes the
# "found in PATH" branch and skips the interactive auto-download prompt
# (which would hang in headless mode).
ARG TOMBI_VERSION=0.11.4
RUN ARCH=$(uname -m) \
 && TOMBI_TARGET="${ARCH}-unknown-linux-musl" \
 && curl -fsSL "https://github.com/tombi-toml/tombi/releases/download/v${TOMBI_VERSION}/tombi-cli-${TOMBI_VERSION}-${TOMBI_TARGET}.tar.gz" \
      -o /tmp/tombi.tar.gz \
 && tar -xzf /tmp/tombi.tar.gz -C /tmp \
 && install -m 0755 "/tmp/tombi-cli-${TOMBI_VERSION}-${TOMBI_TARGET}/tombi" /usr/local/bin/tombi \
 && rm -rf /tmp/tombi.tar.gz "/tmp/tombi-cli-${TOMBI_VERSION}-${TOMBI_TARGET}" \
 && tombi --version

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /work

# Install dependencies first so the layer is cached when only source changes.
# --ignore-scripts skips the `prepare` lifecycle (which would try to build
# before sources are copied).
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build the extension.
COPY . .
RUN pnpm build

# coc.nvim (release branch ships prebuilt JS, no node build needed).
RUN git clone --depth 1 -b release https://github.com/neoclide/coc.nvim \
      /root/.local/share/nvim/site/pack/coc/start/coc.nvim

# Drop the built extension into coc's extension directory and declare it
# in the extensions manifest so coc loads it on startup.
RUN mkdir -p /root/.config/coc/extensions/node_modules \
 && ln -s /work /root/.config/coc/extensions/node_modules/coc-toml \
 && printf '{\n  "dependencies": {\n    "coc-toml": "file:./node_modules/coc-toml"\n  }\n}\n' \
      > /root/.config/coc/extensions/package.json

# Minimal init.vim and coc-settings.json for the test environment.
COPY docker/init.vim /root/.config/nvim/init.vim
COPY docker/coc-settings.json /root/.config/nvim/coc-settings.json
COPY docker/smoke-test.sh /usr/local/bin/smoke-test

RUN chmod +x /usr/local/bin/smoke-test

ENTRYPOINT ["smoke-test"]
