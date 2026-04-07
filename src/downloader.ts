import { window } from 'coc.nvim';
import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import https from 'https';
import { IncomingMessage } from 'http';

const GITHUB_REPO = 'tombi-toml/tombi';

export interface ReleaseInfo {
  tag: string;
  version: string;
  assetUrl: string;
  assetName: string;
}

function getPlatform(): string | null {
  const platforms: Record<string, string> = {
    'x64 linux': 'x86_64-unknown-linux-musl',
    'arm64 linux': 'aarch64-unknown-linux-musl',
    'x64 darwin': 'x86_64-apple-darwin',
    'arm64 darwin': 'aarch64-apple-darwin',
    'x64 win32': 'x86_64-pc-windows-msvc',
    'arm64 win32': 'aarch64-pc-windows-msvc',
  };
  return platforms[`${process.arch} ${process.platform}`] ?? null;
}

function getBinaryName(): string {
  return process.platform === 'win32' ? 'tombi.exe' : 'tombi';
}

function httpsGet(url: string): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { 'User-Agent': 'coc-toml' } },
      resolve,
    );
    req.on('error', reject);
  });
}

async function httpsGetFollowRedirects(url: string): Promise<IncomingMessage> {
  const res = await httpsGet(url);
  if (
    (res.statusCode === 301 || res.statusCode === 302) &&
    res.headers.location
  ) {
    return httpsGetFollowRedirects(res.headers.location);
  }
  return res;
}

async function fetchJson(url: string): Promise<any> {
  const res = await httpsGetFollowRedirects(url);
  if (res.statusCode !== 200) {
    throw new Error(`HTTP ${res.statusCode} for ${url}`);
  }
  return new Promise((resolve, reject) => {
    let data = '';
    res.on('data', (chunk: string) => (data += chunk));
    res.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    res.on('error', reject);
  });
}

export async function getLatestRelease(): Promise<ReleaseInfo | null> {
  const platform = getPlatform();
  if (!platform) {
    window.showErrorMessage(
      `Unsupported platform: ${process.arch} ${process.platform}`,
    );
    return null;
  }

  const suffix = process.platform === 'win32' ? 'zip' : 'gz';

  const release = await fetchJson(
    `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
  );

  const tag: string = release.tag_name;
  const version = tag.startsWith('v') ? tag.slice(1) : tag;

  const asset = (release.assets as any[]).find((a: any) =>
    a.name.endsWith(`${platform}.${suffix}`),
  );

  if (!asset) {
    window.showErrorMessage(
      `No tombi binary found for ${platform} in release ${tag}`,
    );
    return null;
  }

  return {
    tag,
    version,
    assetUrl: asset.browser_download_url,
    assetName: asset.name,
  };
}

export async function downloadServer(
  release: ReleaseInfo,
  storagePath: string,
): Promise<string> {
  await fs.promises.mkdir(storagePath, { recursive: true });

  const binaryName = getBinaryName();
  const destPath = path.join(storagePath, binaryName);
  const tmpPath = `${destPath}.tmp-${Date.now().toString(16)}`;

  const statusItem = window.createStatusBarItem(0, { progress: true });
  statusItem.text = `Downloading tombi ${release.version}...`;
  statusItem.show();

  try {
    const res = await httpsGetFollowRedirects(release.assetUrl);
    if (res.statusCode !== 200) {
      throw new Error(`HTTP ${res.statusCode} downloading ${release.assetUrl}`);
    }

    const dest = fs.createWriteStream(tmpPath, { mode: 0o755 });

    if (release.assetName.endsWith('.gz')) {
      await pipeline(res, createGunzip(), dest);
    } else {
      // .zip handling for Windows
      const zipTmp = `${tmpPath}.zip`;
      const zipDest = fs.createWriteStream(zipTmp);
      await pipeline(res, zipDest);
      // Extract using built-in unzip on Windows
      execSync(
        `powershell -Command "Expand-Archive -Path '${zipTmp}' -DestinationPath '${storagePath}' -Force"`,
        { encoding: 'utf-8' },
      );
      await fs.promises.unlink(zipTmp).catch(() => {});
      // The extracted binary should be in storagePath
      return destPath;
    }

    // Atomic rename
    await fs.promises.rename(tmpPath, destPath);
    return destPath;
  } finally {
    statusItem.hide();
    statusItem.dispose();
    // Clean up tmp file on failure
    await fs.promises.unlink(tmpPath).catch(() => {});
  }
}

export function getStoredBinaryPath(storagePath: string): string | null {
  const binaryPath = path.join(storagePath, getBinaryName());
  return fs.existsSync(binaryPath) ? binaryPath : null;
}
